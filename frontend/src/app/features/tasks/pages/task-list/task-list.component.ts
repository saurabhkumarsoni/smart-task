import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Task, Member, Project } from '../../../../core/models/app-models';
import { TaskService, TaskOverview } from '../../../../core/services/task.service';
import { ProjectMemberService } from '../../../../core/services/project-member.service';
import { ProjectService } from '../../../../core/services/project.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TaskListFilters, TaskDraft, TaskPriorityChangeEvent, TaskStatusChangeEvent } from '../../models/task-list.models';
import { TaskListToolbarComponent } from '../../components/task-list-toolbar/task-list-toolbar.component';
import { TaskCreateDialogComponent } from '../../components/task-create-dialog/task-create-dialog.component';
import { TaskBulkActionsComponent } from '../../components/task-bulk-actions/task-bulk-actions.component';
import { TaskTableComponent } from '../../components/task-table/task-table.component';
import { TaskPaginationComponent } from '../../components/task-pagination/task-pagination.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskListToolbarComponent, TaskCreateDialogComponent, TaskBulkActionsComponent, TaskTableComponent, TaskPaginationComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly taskService = inject(TaskService);
  private readonly memberService = inject(ProjectMemberService);
  private readonly projectService = inject(ProjectService);
  private readonly toast = inject(ToastService);
  private readonly search$ = new Subject<string>();

  protected projectId = '';
  protected readonly project = signal<Project | null>(null);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly members = signal<Member[]>([]);
  protected readonly overview = signal<TaskOverview | null>(null);
  protected readonly loading = signal(false);
  protected readonly creating = signal(false);
  protected readonly creatingSaving = signal(false);
  protected readonly selectedIds = signal<string[]>([]);
  protected readonly bulkBusy = signal(false);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly totalCount = signal(0);
  protected readonly projectCompleted = signal(0);
  protected readonly projectActive = signal(0);

  protected filters: TaskListFilters = { search:'', status:'', priority:'', assignee_id:'', due_before:'', due_after:'' };
  protected sortBy = 'created_at';
  protected sortOrder = 'desc';

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  protected readonly activeFilterCount = computed(() => ['status','priority','assignee_id','due_before','due_after'].filter(k => Boolean(this.filters[k as keyof TaskListFilters])).length);
  protected readonly allSelected = computed(() => this.tasks().length > 0 && this.tasks().every(t => this.selectedIds().includes(t.id)));

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.projectId) return;

    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(() => this.refresh());
    this.projectService.getProject(this.projectId).subscribe({ next: p => this.project.set(p) });
    this.memberService.members(this.projectId).subscribe({ next: m => this.members.set(m) });
    this.memberService.overview(this.projectId).subscribe({
      next: overview => {
        this.projectCompleted.set(overview.completed_tasks);
        this.projectActive.set(overview.active_tasks);
      },
    });
    this.refresh();
  }

  private readonly destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onSearchChange(value: string): void { this.filters.search = value; this.page.set(1); this.search$.next(value); }
  protected onFiltersChange(): void { this.page.set(1); this.refresh(); }
  protected onClearFilters(): void { this.filters = { search:'', status:'', priority:'', assignee_id:'', due_before:'', due_after:'' }; this.page.set(1); this.refresh(); }
  protected onSortChange(value: string): void { this.sortBy = value; this.refresh(); }
  protected onSortOrderChange(value: string): void { this.sortOrder = value; this.refresh(); }

  protected refresh(): void {
    if (!this.projectId) return;
    this.loading.set(true);
    const query = { ...this.filters, sort_by:this.sortBy, sort_order:this.sortOrder, page:this.page(), size:this.pageSize(), status:this.filters.status || undefined, priority:this.filters.priority || undefined, assignee_id:this.filters.assignee_id || undefined, search:this.filters.search || undefined, due_before:this.filters.due_before || undefined, due_after:this.filters.due_after || undefined };
    this.taskService.getTasks(this.projectId, query).subscribe({
      next: tasks => { this.tasks.set(tasks); this.loading.set(false); this.reconcileTotal(tasks.length); },
      error: () => { this.tasks.set([]); this.loading.set(false); this.toast.error('Unable to load tasks'); },
    });
    this.taskService.getTaskOverview(this.projectId, this.filters).subscribe({ next: v => { this.overview.set(v); this.totalCount.set(v.total_count); }, error: () => this.overview.set(null) });
  }

  private reconcileTotal(pageLength: number): void {
    if (this.totalCount() === 0 || this.page() === 1) this.totalCount.set(pageLength);
  }

  protected openCreate(): void { this.creating.set(true); }
  protected closeCreate(): void { if (!this.creatingSaving()) this.creating.set(false); }
  protected createTask(draft: TaskDraft): void {
    this.creatingSaving.set(true);
    this.taskService.createTask(this.projectId, { title:draft.title, description:draft.description || undefined, priority:draft.priority, assignee_id:draft.assignee_id || undefined, due_date:draft.due_date || undefined }).subscribe({
      next: () => { this.creatingSaving.set(false); this.creating.set(false); this.page.set(1); this.refresh(); this.toast.success('Task created'); },
      error: () => { this.creatingSaving.set(false); this.toast.error('Could not create the task'); },
    });
  }

  protected toggleSelect(id: string): void { this.selectedIds.update(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]); }
  protected toggleAll(): void { this.selectedIds.set(this.allSelected() ? [] : this.tasks().map(t => t.id)); }
  protected clearSelection(): void { this.selectedIds.set([]); }

  protected quickStatus(event: TaskStatusChangeEvent): void {
    this.taskService.updateTask(this.projectId, event.task.id, { status:event.status }).subscribe({ next: updated => { this.patchTask(updated); this.toast.success('Status updated'); }, error: () => this.toast.error('Status could not be updated') });
  }
  protected quickPriority(event: TaskPriorityChangeEvent): void {
    this.taskService.updateTask(this.projectId, event.task.id, { priority:event.priority }).subscribe({ next: updated => { this.patchTask(updated); this.toast.success('Priority updated'); }, error: () => this.toast.error('Priority could not be updated') });
  }
  private patchTask(updated: Task): void { this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t)); }

  protected deleteTask(task: Task): void {
    if (!confirm(`Delete “${task.title}”? This action cannot be undone.`)) return;
    this.taskService.deleteTask(this.projectId, task.id).subscribe({ next: () => { this.tasks.update(list => list.filter(t => t.id !== task.id)); this.selectedIds.update(ids => ids.filter(id => id !== task.id)); this.totalCount.update(v => Math.max(0, v - 1)); this.toast.success('Task deleted'); }, error: () => this.toast.error('Could not delete the task') });
  }

  protected bulkStatus(status: string): void { this.runBulk(ids => this.taskService.updateTask(this.projectId, ids, { status } as never), 'status'); }
  protected bulkAssignee(assigneeId: string): void { this.runBulk(ids => this.taskService.updateTask(this.projectId, ids, { assignee_id:assigneeId } as never), 'assignee'); }

  private runBulk(factory: (id: string) => any, label: string): void {
    const ids = [...this.selectedIds()]; if (!ids.length) return;
    this.bulkBusy.set(true);
    let completed = 0; let failed = 0;
    ids.forEach(id => factory(id).subscribe({ next: (updated: Task) => { completed++; this.patchTask(updated); finish(); }, error: () => { failed++; finish(); } }));
    const finish = () => { if (completed + failed === ids.length) { this.bulkBusy.set(false); this.clearSelection(); this.refresh(); failed ? this.toast.error(`${failed} task${failed > 1 ? 's' : ''} could not be updated`) : this.toast.success(`${ids.length} task${ids.length > 1 ? 's' : ''} updated`); } };
  }

  protected bulkDelete(): void {
    const ids = [...this.selectedIds()]; if (!ids.length || !confirm(`Delete ${ids.length} selected task${ids.length > 1 ? 's' : ''}?`)) return;
    this.bulkBusy.set(true); let completed=0, failed=0;
    const finish = () => { if (completed + failed === ids.length) { this.bulkBusy.set(false); this.clearSelection(); this.refresh(); failed ? this.toast.error('Some tasks could not be deleted') : this.toast.success(`${ids.length} tasks deleted`); } };
    ids.forEach(id => this.taskService.deleteTask(this.projectId,id).subscribe({ next:()=>{completed++;finish();}, error:()=>{failed++;finish();} }));
  }

  protected goToPage(page: number): void { this.page.set(page); this.clearSelection(); this.refresh(); }
  protected changePageSize(size: number): void { this.pageSize.set(size); this.page.set(1); this.clearSelection(); this.refresh(); }
  protected projectInitials(): string { const n=this.project()?.name?.trim(); if(!n)return 'PR'; const w=n.split(/\s+/); return (w.length===1?w[0].slice(0,2):w[0][0]+w[w.length-1][0]).toUpperCase(); }
  protected progress(): number {
    const total = this.project()?.tasksCount ?? (this.projectCompleted() + this.projectActive());
    return total ? Math.min(100, Math.round((this.projectCompleted() / total) * 100)) : 0;
  }
}
