import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Task, Member } from '../../../../core/models/app-models';
import { TaskService, TaskOverview } from '../../../../core/services/task.service';
import { ProjectMemberService } from '../../../../core/services/project-member.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page-card">
      <div class="title">
        <div>
          <h2>Tasks</h2>
          @if (overview()) {
            <p class="overview-summary">{{ overview()!.summary }}</p>
          }
        </div>
        <button (click)="creating.set(!creating())">New task</button>
      </div>

      @if (creating()) {
        <form (ngSubmit)="create()" class="form">
          <input [(ngModel)]="draft.title" name="title" placeholder="Title" required />
          <textarea
            [(ngModel)]="draft.description"
            name="description"
            placeholder="Description"
          ></textarea>
          <select [(ngModel)]="draft.priority" name="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input [(ngModel)]="draft.due_date" name="due" type="date" />
          <button type="submit">Create</button>
        </form>
      }

      <div class="filters">
        <input
          [(ngModel)]="filters.search"
          (ngModelChange)="onFiltersChange()"
          placeholder="Search tasks"
        />
        <select [(ngModel)]="filters.status" (ngModelChange)="onFiltersChange()">
          <option value="">All statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In progress</option>
          <option value="in_review">Review</option>
          <option value="done">Done</option>
        </select>
        <select [(ngModel)]="filters.priority" (ngModelChange)="onFiltersChange()">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select [(ngModel)]="filters.assignee_id" (ngModelChange)="onFiltersChange()">
          <option value="">All assignees</option>
          @for (member of members(); track member.user_id) {
            <option [value]="member.user_id">
              {{ member.user_name || member.user_email || member.user_id }}
            </option>
          }
        </select>
        <input
          [(ngModel)]="filters.due_before"
          (ngModelChange)="onFiltersChange()"
          type="date"
          title="Due before"
        />
        <input
          [(ngModel)]="filters.due_after"
          (ngModelChange)="onFiltersChange()"
          type="date"
          title="Due after"
        />
        <button type="button" (click)="clearFilters()" class="btn-secondary">Clear</button>
      </div>

      <div class="sort-row">
        <select [(ngModel)]="sortBy" (ngModelChange)="onSortChange()">
          <option value="created_at">Created date</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
          <option value="priority">Priority</option>
          <option value="due_date">Due date</option>
        </select>
        <select [(ngModel)]="sortOrder" (ngModelChange)="onSortChange()">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      @if (selectedIds().length > 0) {
        <div class="bulk-actions">
          <span>{{ selectedIds().length }} selected</span>
          <select [(ngModel)]="bulkStatus" name="bulk_status">
            <option value="">Set status…</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In progress</option>
            <option value="in_review">Review</option>
            <option value="done">Done</option>
          </select>
          <button (click)="bulkChangeStatus()" [disabled]="!bulkStatus">Apply status</button>
          <select [(ngModel)]="bulkAssignee" name="bulk_assignee">
            <option value="">Assign to…</option>
            @for (member of members(); track member.user_id) {
              <option [value]="member.user_id">
                {{ member.user_name || member.user_email || member.user_id }}
              </option>
            }
          </select>
          <button (click)="bulkAssign()" [disabled]="!bulkAssignee">Assign</button>
          <button (click)="bulkDelete()" class="btn-danger">Delete</button>
          <button (click)="clearSelection()" class="btn-secondary">Clear</button>
        </div>
      }

      <table>
        <tr>
          <th><input type="checkbox" [checked]="allSelected()" (change)="toggleAll()" /></th>
          <th>Task</th>
          <th>Status</th>
          <th>Priority</th>
          <th>Assignee</th>
          <th>Due</th>
          <th class="actions-col">Actions</th>
        </tr>
        @for (task of tasks(); track task.id) {
          <tr [class.selected]="isSelected(task.id)">
            <td>
              <input
                type="checkbox"
                [checked]="isSelected(task.id)"
                (change)="toggleSelect(task.id)"
              />
            </td>
            <td>
              <a [routerLink]="['/projects', projectId, 'tasks', task.id]">{{ task.title }}</a>
            </td>
            <td>
              <select
                [ngModel]="task.status"
                (ngModelChange)="quickChangeStatus(task, $event)"
                class="inline-select"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In progress</option>
                <option value="in_review">Review</option>
                <option value="done">Done</option>
              </select>
            </td>
            <td>
              <select
                [ngModel]="task.priority"
                (ngModelChange)="quickChangePriority(task, $event)"
                class="inline-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </td>
            <td>{{ assigneeName(task.assignee_id) }}</td>
            <td>{{ task.due_date || '—' }}</td>
            <td class="actions-col">
              <a [routerLink]="['/projects', projectId, 'tasks', task.id]" class="btn-text">View</a>
              <button (click)="deleteOne(task)" class="btn-text btn-danger">Delete</button>
            </td>
          </tr>
        } @empty {
          <tr>
            <td colspan="7" class="empty-state">No tasks match your filters</td>
          </tr>
        }
      </table>

      <div class="pagination">
        <button
          [disabled]="page() <= 1"
          (click)="page.set(page() - 1); load()"
          class="btn-secondary"
        >
          ‹ Prev
        </button>
        <span>Page {{ page() }} of {{ totalPages() }}</span>
        <button
          [disabled]="page() >= totalPages()"
          (click)="page.set(page() + 1); load()"
          class="btn-secondary"
        >
          Next ›
        </button>
        <select [ngModel]="pageSize()" (ngModelChange)="changePageSize($event)">
          <option [ngValue]="10">10 / page</option>
          <option [ngValue]="20">20 / page</option>
          <option [ngValue]="50">50 / page</option>
        </select>
      </div>
    </section>
  `,
  styles: [
    `
      .page-card {
        padding: 20px;
      }
      .title {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .overview-summary {
        color: #94a3b8;
        font-size: 0.85rem;
        margin: 4px 0 0;
      }
      .form {
        display: grid;
        gap: 8px;
        margin: 12px 0;
        max-width: 500px;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 16px 0 8px;
        align-items: center;
      }
      input,
      textarea,
      select {
        padding: 8px;
        border: 1px solid #334155;
        border-radius: 6px;
        background: #0f172a;
        color: #f1f5f9;
        font-size: 0.875rem;
      }
      .filters input[type='date'] {
        max-width: 150px;
      }
      .sort-row {
        display: flex;
        gap: 8px;
        margin: 8px 0;
      }
      .bulk-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        padding: 10px 12px;
        background: #1e293b;
        border-radius: 8px;
        margin: 8px 0;
      }
      .bulk-actions span {
        font-weight: 600;
        color: #c4b5fd;
        font-size: 0.875rem;
      }
      table {
        width: 100%;
        margin-top: 12px;
        text-align: left;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 10px 12px;
        border-bottom: 1px solid #1e293b;
        vertical-align: middle;
      }
      th {
        color: #94a3b8;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      tr.selected td {
        background: rgba(124, 58, 237, 0.08);
      }
      .inline-select {
        padding: 4px 8px;
        font-size: 0.8rem;
      }
      .actions-col {
        white-space: nowrap;
      }
      .btn-text {
        background: none;
        border: none;
        color: #7c3aed;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 0.85rem;
        text-decoration: none;
      }
      .btn-text:hover {
        text-decoration: underline;
      }
      .btn-text.btn-danger {
        color: #ef4444;
      }
      .btn-secondary {
        padding: 6px 12px;
        background: #334155;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .btn-secondary:hover:not(:disabled) {
        background: #475569;
      }
      .btn-secondary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .btn-danger {
        background: #b91c1c;
      }
      .btn-danger:hover:not(:disabled) {
        background: #991b1b;
      }
      .pagination {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 16px;
        font-size: 0.875rem;
        color: #94a3b8;
      }
      .empty-state {
        color: #64748b;
        font-style: italic;
        text-align: center;
        padding: 32px;
      }
      button[type='submit'] {
        padding: 8px 16px;
        background: #7c3aed;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      }
      button[type='submit']:hover {
        background: #6d28d9;
      }
    `,
  ],
})
export class TaskListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(TaskService);
  private readonly memberService = inject(ProjectMemberService);
  private readonly toast = inject(ToastService);

  protected projectId = '';
  protected readonly tasks = signal<Task[]>([]);
  protected readonly members = signal<Member[]>([]);
  protected readonly overview = signal<TaskOverview | null>(null);
  protected readonly creating = signal(false);
  protected readonly selectedIds = signal<string[]>([]);
  protected readonly loading = signal(false);

  protected draft: Partial<Task> = { priority: 'medium' };

  protected filters: {
    search: string;
    status: string;
    priority: string;
    assignee_id: string;
    due_before: string;
    due_after: string;
  } = { search: '', status: '', priority: '', assignee_id: '', due_before: '', due_after: '' };

  protected sortBy = 'created_at';
  protected sortOrder = 'desc';
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly totalCount = signal(0);

  protected bulkStatus = '';
  protected bulkAssignee = '';

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize())),
  );

  protected readonly allSelected = computed(
    () => this.tasks().length > 0 && this.tasks().every((t) => this.isSelected(t.id)),
  );

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadMembers();
    this.load();
    this.loadOverview();
  }

  protected load(): void {
    this.loading.set(true);
    this.service
      .getTasks(this.projectId, {
        status: this.filters.status || undefined,
        priority: this.filters.priority || undefined,
        assignee_id: this.filters.assignee_id || undefined,
        search: this.filters.search || undefined,
        due_before: this.filters.due_before || undefined,
        due_after: this.filters.due_after || undefined,
        sort_by: this.sortBy,
        sort_order: this.sortOrder,
        page: this.page(),
        size: this.pageSize(),
      })
      .subscribe({
        next: (v) => {
          this.tasks.set(v);
          const overview = this.overview();
          const total = overview?.total_count ?? 0;
          this.totalCount.set(total > 0 ? total : (this.page() - 1) * this.pageSize() + v.length);
          this.loading.set(false);
        },
        error: () => {
          this.tasks.set([]);
          this.loading.set(false);
        },
      });
  }

  protected loadOverview(): void {
    this.service
      .getTaskOverview(this.projectId, {
        status: this.filters.status || undefined,
        priority: this.filters.priority || undefined,
        assignee_id: this.filters.assignee_id || undefined,
        search: this.filters.search || undefined,
        due_before: this.filters.due_before || undefined,
        due_after: this.filters.due_after || undefined,
      })
      .subscribe({
        next: (v) => {
          this.overview.set(v);
          if (v.total_count > 0) {
            this.totalCount.set(v.total_count);
          }
        },
        error: () => this.overview.set(null),
      });
  }

  protected loadMembers(): void {
    this.memberService.members(this.projectId).subscribe((v) => this.members.set(v));
  }

  protected onFiltersChange(): void {
    this.page.set(1);
    this.load();
    this.loadOverview();
  }

  protected onSortChange(): void {
    this.load();
  }

  protected changePageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
    this.load();
  }

  protected clearFilters(): void {
    this.filters = {
      search: '',
      status: '',
      priority: '',
      assignee_id: '',
      due_before: '',
      due_after: '',
    };
    this.page.set(1);
    this.load();
    this.loadOverview();
  }

  protected create(): void {
    if (this.draft.title) {
      this.service.createTask(this.projectId, this.draft).subscribe({
        next: () => {
          this.draft = { priority: 'medium' };
          this.creating.set(false);
          this.load();
          this.loadOverview();
          this.toast.success('Task created');
        },
        error: () => this.toast.error('Failed to create task'),
      });
    }
  }

  protected assigneeName(assigneeId?: string | null): string {
    if (!assigneeId) return '—';
    const member = this.members().find((m) => m.user_id === assigneeId);
    return member?.user_name || member?.user_email || assigneeId;
  }

  protected quickChangeStatus(task: Task, status: string): void {
    this.service.updateTask(this.projectId, task.id, { status }).subscribe({
      next: (updated) => {
        this.tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
        this.toast.success('Status updated');
      },
      error: () => this.toast.error('Failed to update status'),
    });
  }

  protected quickChangePriority(task: Task, priority: string): void {
    this.service.updateTask(this.projectId, task.id, { priority }).subscribe({
      next: (updated) => {
        this.tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
        this.toast.success('Priority updated');
      },
      error: () => this.toast.error('Failed to update priority'),
    });
  }

  protected deleteOne(task: Task): void {
    if (confirm(`Delete task "${task.title}"?`)) {
      this.service.deleteTask(this.projectId, task.id).subscribe({
        next: () => {
          this.tasks.update((list) => list.filter((t) => t.id !== task.id));
          this.loadOverview();
          this.toast.success('Task deleted');
        },
        error: () => this.toast.error('Failed to delete task'),
      });
    }
  }

  // Bulk selection
  protected isSelected(taskId: string): boolean {
    return this.selectedIds().includes(taskId);
  }

  protected toggleSelect(taskId: string): void {
    this.selectedIds.update((ids) =>
      ids.includes(taskId) ? ids.filter((id) => id !== taskId) : [...ids, taskId],
    );
  }

  protected toggleAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set([]);
    } else {
      this.selectedIds.set(this.tasks().map((t) => t.id));
    }
  }

  protected clearSelection(): void {
    this.selectedIds.set([]);
    this.bulkStatus = '';
    this.bulkAssignee = '';
  }

  protected bulkChangeStatus(): void {
    if (!this.bulkStatus || this.selectedIds().length === 0) return;
    const ids = [...this.selectedIds()];
    let done = 0;
    ids.forEach((id) => {
      this.service.updateTask(this.projectId, id, { status: this.bulkStatus }).subscribe({
        next: () => {
          done += 1;
          if (done === ids.length) {
            this.clearSelection();
            this.load();
            this.loadOverview();
            this.toast.success(`Updated ${ids.length} tasks`);
          }
        },
        error: () => {
          done += 1;
          if (done === ids.length) {
            this.clearSelection();
            this.load();
            this.toast.error('Some tasks failed to update');
          }
        },
      });
    });
  }

  protected bulkAssign(): void {
    if (!this.bulkAssignee || this.selectedIds().length === 0) return;
    const ids = [...this.selectedIds()];
    let done = 0;
    ids.forEach((id) => {
      this.service.updateTask(this.projectId, id, { assignee_id: this.bulkAssignee }).subscribe({
        next: () => {
          done += 1;
          if (done === ids.length) {
            this.clearSelection();
            this.load();
            this.toast.success(`Assigned ${ids.length} tasks`);
          }
        },
        error: () => {
          done += 1;
          if (done === ids.length) {
            this.clearSelection();
            this.load();
            this.toast.error('Some tasks failed to assign');
          }
        },
      });
    });
  }

  protected bulkDelete(): void {
    const ids = [...this.selectedIds()];
    if (!confirm(`Delete ${ids.length} selected task(s)?`)) return;
    let done = 0;
    ids.forEach((id) => {
      this.service.deleteTask(this.projectId, id).subscribe({
        next: () => {
          done += 1;
          if (done === ids.length) {
            this.clearSelection();
            this.load();
            this.loadOverview();
            this.toast.success(`Deleted ${ids.length} tasks`);
          }
        },
        error: () => {
          done += 1;
          if (done === ids.length) {
            this.clearSelection();
            this.load();
            this.toast.error('Some tasks failed to delete');
          }
        },
      });
    });
  }
}
