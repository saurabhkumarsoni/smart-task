import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { catchError, forkJoin, map, of } from 'rxjs';
import { Member, Sprint, Task, TaskAssignee } from '../../../../core/models/app-models';
import { SprintService } from '../../../../core/services/sprint.service';
import { TaskService } from '../../../../core/services/task.service';
import { ProjectMemberService } from '../../../../core/services/project-member.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  getTaskAssigneeName,
  getTaskAssigneeInitials,
} from '../../../../core/utils/task-display.utils';
@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule],
  templateUrl: './backlog.component.html',
  styleUrl: './backlog.component.scss',
})
export class BacklogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tasksApi = inject(TaskService);
  private readonly sprintsApi = inject(SprintService);
  private readonly memberService = inject(ProjectMemberService);
  private readonly toast = inject(ToastService);

  protected projectId = '';
  protected readonly tasks = signal<Task[]>([]);
  protected readonly sprints = signal<Sprint[]>([]);
  protected readonly members = signal<Member[]>([]);
  protected readonly creating = signal(false);
  protected readonly selectedIds = signal<string[]>([]);
  protected readonly loading = signal(false);
  protected readonly refreshing = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly savingBulk = signal(false);

  protected readonly query = signal('');
  protected readonly priority = signal('');
  protected readonly status = signal('');
  protected readonly assigneeId = signal('');
  protected readonly backlogOnly = signal(false);
  protected readonly sortBy = signal('manual');
  protected readonly bulkSprintId = signal('');

  protected draft: Partial<Task> = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignee_id: null,
  };

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const priority = this.priority();
    const status = this.status();
    const assigneeId = this.assigneeId();
    const backlogOnly = this.backlogOnly();
    const sortBy = this.sortBy();

    const result = this.tasks().filter((task) => {
      const haystack =
        `${task.title} ${task.description || ''} ${this.assigneeName(task)}`.toLowerCase();

      return (
        (!q || haystack.includes(q)) &&
        (!priority || this.normalizePriority(task.priority) === priority) &&
        (!status || this.normalizeStatus(task.status) === status) &&
        (!assigneeId || task.assignee_id === assigneeId) &&
        (!backlogOnly || !task.sprint_id)
      );
    });

    if (sortBy === 'manual') return result;

    return [...result].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'due') return this.dateValue(a.due_date) - this.dateValue(b.due_date);
      if (sortBy === 'updated') return this.dateValue(b.updated_at) - this.dateValue(a.updated_at);
      if (sortBy === 'priority')
        return this.priorityRank(a.priority) - this.priorityRank(b.priority);
      return 0;
    });
  });

  protected readonly totalCount = computed(() => this.tasks().length);
  protected readonly backlogCount = computed(
    () => this.tasks().filter((task) => !task.sprint_id).length,
  );
  protected readonly activeSprintCount = computed(
    () => this.sprints().filter((sprint) => sprint.is_active).length,
  );
  protected readonly criticalCount = computed(
    () =>
      this.tasks().filter((task) => this.normalizePriority(task.priority) === 'critical').length,
  );
  protected readonly doneCount = computed(
    () => this.tasks().filter((task) => this.normalizeStatus(task.status) === 'done').length,
  );
  protected readonly hasFilters = computed(
    () =>
      !!this.query().trim() ||
      !!this.priority() ||
      !!this.status() ||
      !!this.assigneeId() ||
      this.backlogOnly(),
  );
  protected readonly allVisibleSelected = computed(() => {
    const visible = this.filtered();
    return visible.length > 0 && visible.every((task) => this.selectedIds().includes(task.id));
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const projectId = params.get('id') || '';
      if (!projectId || projectId === this.projectId) return;

      this.projectId = projectId;
      this.clearFilters();
      this.clearSelection();
      this.load();
    });
  }

  protected create(): void {
    const title = String(this.draft.title || '').trim();
    if (!title || !this.projectId) return;

    this.loading.set(true);
    this.errorMessage.set('');

    this.tasksApi
      .createTask(this.projectId, {
        title,
        description: String(this.draft.description || '').trim() || null,
        priority: this.draft.priority || 'medium',
        status: this.draft.status || 'todo',
        assignee_id: this.draft.assignee_id || null,
      })
      .subscribe({
        next: () => {
          this.resetDraft();
          this.creating.set(false);
          this.loadTasks();
          this.toast.success('Work item created');
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('The work item could not be created. Please try again.');
          this.toast.error('Failed to create work item');
        },
      });
  }

  protected assign(task: Task, sprintId: string): void {
    if (!this.projectId) return;

    const previousSprint = task.sprint_id || null;
    const request$ = sprintId
      ? this.sprintsApi.assign(this.projectId, sprintId, task.id)
      : this.tasksApi.updateTask(this.projectId, task.id, { sprint_id: null });

    request$.subscribe({
      next: () => {
        this.tasks.update((tasks) =>
          tasks.map((item) =>
            item.id === task.id ? { ...item, sprint_id: sprintId || null } : item,
          ),
        );
        this.toast.success(
          sprintId ? 'Work item moved to sprint' : 'Work item returned to backlog',
        );
      },
      error: () => {
        this.toast.error(
          previousSprint ? 'Could not update sprint assignment' : 'Could not move work item',
        );
        this.loadTasks();
      },
    });
  }

  protected onReorder(event: CdkDragDrop<Task[]>): void {
    if (this.sortBy() !== 'manual' || event.previousIndex === event.currentIndex) return;

    const visible = this.filtered();
    const movedId = visible[event.previousIndex]?.id;
    const targetId = visible[event.currentIndex]?.id;
    if (!movedId || !targetId || movedId === targetId) return;

    const ordered = [...this.tasks()];
    const fromIndex = ordered.findIndex((task) => task.id === movedId);
    const targetIndex = ordered.findIndex((task) => task.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return;

    const [moved] = ordered.splice(fromIndex, 1);
    const insertIndex = ordered.findIndex((task) => task.id === targetId);
    ordered.splice(insertIndex < 0 ? targetIndex : insertIndex, 0, moved);
    this.tasks.set(ordered);
  }

  protected isSelected(taskId: string): boolean {
    return this.selectedIds().includes(taskId);
  }

  protected toggleSelect(taskId: string): void {
    this.selectedIds.update((ids) =>
      ids.includes(taskId) ? ids.filter((id) => id !== taskId) : [...ids, taskId],
    );
  }

  protected toggleSelectVisible(): void {
    const visibleIds = this.filtered().map((task) => task.id);
    if (this.allVisibleSelected()) {
      this.selectedIds.update((ids) => ids.filter((id) => !visibleIds.includes(id)));
    } else {
      this.selectedIds.update((ids) => Array.from(new Set([...ids, ...visibleIds])));
    }
  }

  protected clearSelection(): void {
    this.selectedIds.set([]);
    this.bulkSprintId.set('');
  }

  protected bulkAssignSprint(): void {
    const sprintId = this.bulkSprintId();
    const ids = [...this.selectedIds()];
    if (!sprintId || !ids.length || !this.projectId || this.savingBulk()) return;

    this.savingBulk.set(true);
    const requests = ids.map((id) =>
      this.sprintsApi.assign(this.projectId, sprintId, id).pipe(
        map(() => true),
        catchError(() => of(false)),
      ),
    );

    forkJoin(requests).subscribe((results) => {
      const failed = results.filter((success) => !success).length;
      this.savingBulk.set(false);
      this.clearSelection();
      this.loadTasks();

      if (failed === 0) {
        this.toast.success(`Moved ${ids.length} work item${ids.length === 1 ? '' : 's'} to sprint`);
      } else {
        this.toast.error(`${failed} work item${failed === 1 ? '' : 's'} could not be moved`);
      }
    });
  }

  protected clearFilters(): void {
    this.query.set('');
    this.priority.set('');
    this.status.set('');
    this.assigneeId.set('');
    this.backlogOnly.set(false);
    this.sortBy.set('manual');
  }

  protected refresh(): void {
    this.refreshing.set(true);
    this.errorMessage.set('');
    this.loadTasks(() => this.refreshing.set(false));
    this.loadSprints();
    this.loadMembers();
  }

  protected resetDraft(): void {
    this.draft = {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      assignee_id: null,
    };
  }

  protected statusLabel(status: string | null | undefined): string {
    const value = this.normalizeStatus(status);
    return (
      (
        { todo: 'Todo', in_progress: 'In progress', in_review: 'Review', done: 'Done' } as Record<
          string,
          string
        >
      )[value] || 'Todo'
    );
  }

  protected priorityLabel(priority: string | null | undefined): string {
    return this.normalizePriority(priority).replace(/^./, (letter) => letter.toUpperCase());
  }

  protected normalizeStatus(status: string | null | undefined): string {
    return String(status || 'todo')
      .toLowerCase()
      .replace(/-/g, '_');
  }

  protected normalizePriority(priority: string | null | undefined): string {
    return String(priority || 'medium').toLowerCase();
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  protected assigneeName(task: Task): string {
    return getTaskAssigneeName(task);
  }

  protected assigneeInitials(task: Task): string {
    return getTaskAssigneeInitials(task);
  }

  protected memberName(member: Member): string {
    const nested = member.user;
    const fullName = [
      nested?.first_name || member.first_name,
      nested?.last_name || member.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
    return (
      fullName ||
      nested?.username ||
      member.user_name ||
      member.username ||
      nested?.email ||
      member.user_email ||
      member.user_id
    );
  }

  protected sprintTaskCount(sprintId: string): number {
    return this.tasks().filter((task) => task.sprint_id === sprintId).length;
  }

  protected dueLabel(task: Task): string {
    if (!task.due_date) return '';
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due ${due.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}`;
  }

  protected dueClass(task: Task): string {
    if (!task.due_date) return '';
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime()
      ? 'overdue'
      : due.getTime() === today.getTime()
        ? 'today'
        : '';
  }

  protected trackTask(_: number, task: Task): string {
    return task.id;
  }

  private dateValue(value: string | null | undefined): number {
    if (!value) return Number.MAX_SAFE_INTEGER;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
  }

  private priorityRank(priority: string | null | undefined): number {
    return (
      ({ critical: 0, high: 1, medium: 2, low: 3 } as Record<string, number>)[
        this.normalizePriority(priority)
      ] ?? 9
    );
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.loadTasks();
    this.loadSprints();
    this.loadMembers();
  }

  private loadTasks(done?: () => void): void {
    this.tasksApi.getTasks(this.projectId).subscribe({
      next: (value) => {
        this.tasks.set(value || []);
        this.loading.set(false);
        done?.();
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('The latest work items could not be loaded.');
        done?.();
      },
    });
  }

  private loadSprints(): void {
    this.sprintsApi.list(this.projectId).subscribe({
      next: (value) => this.sprints.set(value || []),
      error: () => this.toast.error('Could not load sprints'),
    });
  }

  private loadMembers(): void {
    this.memberService.members(this.projectId).subscribe({
      next: (value) => this.members.set(value || []),
      error: () => this.toast.error('Could not load project members'),
    });
  }
}
