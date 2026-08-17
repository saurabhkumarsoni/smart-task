import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { Task, Sprint } from '../../../../core/models/app-models';
import { TaskService } from '../../../../core/services/task.service';
import { SprintService } from '../../../../core/services/sprint.service';
import { ToastService } from '../../../../core/services/toast.service';

const STATUSES = [
  { key: 'todo', label: 'To do', description: 'Ready to start' },
  { key: 'in_progress', label: 'In progress', description: 'Being worked on' },
  { key: 'in_review', label: 'In review', description: 'Waiting for review' },
  { key: 'done', label: 'Done', description: 'Completed work' },
] as const;

type StatusKey = (typeof STATUSES)[number]['key'];

@Component({
  selector: 'app-sprint-board',
  standalone: true,
  imports: [CommonModule, RouterLink, DragDropModule],
  templateUrl: './sprint-board.component.html',
  styleUrl: './sprint-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SprintBoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly taskService = inject(TaskService);
  private readonly sprintService = inject(SprintService);
  private readonly toast = inject(ToastService);

  protected readonly projectId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly sprintId = this.route.snapshot.paramMap.get('sprintId') ?? '';
  protected readonly sprint = signal<Sprint | null>(null);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly loading = signal(true);
  protected readonly query = signal('');
  protected readonly statuses = STATUSES;
  protected readonly done = computed(
    () => this.tasks().filter((t) => this.normalize(t.status) === 'done').length,
  );
  protected readonly progress = computed(() =>
    this.tasks().length ? Math.round((this.done() / this.tasks().length) * 100) : 0,
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.sprintService.list(this.projectId).subscribe({
      next: (sprints) => this.sprint.set(sprints.find((s) => s.id === this.sprintId) ?? null),
    });
    this.taskService
      .getTasks(this.projectId, {
        sprint_id: this.sprintId,
        size: 100,
        sort_by: 'created_at',
        sort_order: 'asc',
      })
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.loading.set(false);
        },
        error: () => {
          this.tasks.set([]);
          this.loading.set(false);
          this.toast.error('Could not load sprint tasks');
        },
      });
  }

  protected filtered(status: StatusKey): Task[] {
    const q = this.query().trim().toLowerCase();
    return this.tasks().filter(
      (task) =>
        this.normalize(task.status) === status &&
        (!q || `${task.title} ${task.description ?? ''}`.toLowerCase().includes(q)),
    );
  }

  protected drop(event: CdkDragDrop<Task[]>, status: StatusKey): void {
    const task = event.item.data as Task;
    if (!task || this.normalize(task.status) === status) return;
    const previous = task.status;
    this.tasks.update((items) =>
      items.map((item) => (item.id === task.id ? { ...item, status } : item)),
    );
    this.taskService.updateTask(this.projectId, task.id, { status }).subscribe({
      error: () => {
        this.tasks.update((items) =>
          items.map((item) => (item.id === task.id ? { ...item, status: previous } : item)),
        );
        this.toast.error('Status could not be updated');
      },
    });
  }

  protected track(_: number, item: Task): string {
    return item.id;
  }
  protected initials(task: Task): string {
    const name = task.assignee?.name?.trim() || '';
    return name
      ? name
          .split(/\s+/)
          .slice(0, 2)
          .map((x) => x[0])
          .join('')
          .toUpperCase()
      : '?';
  }
  protected normalize(status?: string): StatusKey {
    const value = String(status ?? 'todo')
      .trim()
      .toLowerCase()
      .replaceAll(' ', '_');
    return (
      ['todo', 'in_progress', 'in_review', 'done'].includes(value) ? value : 'todo'
    ) as StatusKey;
  }
}
