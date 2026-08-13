import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Sprint, Task, Member } from '../../../../core/models/app-models';
import { SprintService } from '../../../../core/services/sprint.service';
import { TaskService } from '../../../../core/services/task.service';
import { ProjectMemberService } from '../../../../core/services/project-member.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule],
  template: `
    <section class="backlog">
      <header>
        <div>
          <p>PROJECT PLANNING</p>
          <h2>Backlog</h2>
          <span>Prioritize work, then move it into an active sprint.</span>
        </div>
        <button (click)="creating.set(!creating())">+ Create work item</button>
      </header>

      @if (creating()) {
        <form class="create" (ngSubmit)="create()">
          <input
            [(ngModel)]="draft.title"
            name="title"
            placeholder="What needs to be done?"
            required
          />
          <select [(ngModel)]="draft.priority" name="priority">
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button>Create</button>
        </form>
      }

      <div class="toolbar">
        <input [(ngModel)]="query" placeholder="Search backlog" />
        <select [(ngModel)]="priority">
          <option value="">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select [(ngModel)]="status">
          <option value="">All statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In progress</option>
          <option value="in_review">Review</option>
          <option value="done">Done</option>
        </select>
        <select [(ngModel)]="assigneeId">
          <option value="">All assignees</option>
          @for (member of members(); track member.user_id) {
            <option [value]="member.user_id">
              {{ member.user_name || member.user_email || member.user_id }}
            </option>
          }
        </select>
        <button [class.active]="onlyUnassigned" (click)="onlyUnassigned = !onlyUnassigned">
          Unassigned to sprint
        </button>
      </div>

      @if (selectedIds().length > 0) {
        <div class="bulk-bar">
          <span>{{ selectedIds().length }} selected</span>
          <select [(ngModel)]="bulkSprintId" name="bulk_sprint">
            <option value="">Move to sprint…</option>
            @for (sprint of sprints(); track sprint.id) {
              <option [value]="sprint.id">{{ sprint.name }}</option>
            }
          </select>
          <button (click)="bulkAssignSprint()" [disabled]="!bulkSprintId">Move</button>
          <button (click)="clearSelection()">Clear</button>
        </div>
      }

      <div class="layout">
        <section class="work-list">
          <div class="list-head">
            <b>Work items</b>
            <span>{{ filtered().length }} shown</span>
          </div>

          <div cdkDropList (cdkDropListDropped)="onReorder($event)">
            @for (task of filtered(); track task.id) {
              <article class="work-item" cdkDrag [cdkDragData]="task">
                <input
                  type="checkbox"
                  [checked]="isSelected(task.id)"
                  (change)="toggleSelect(task.id)"
                />
                <span class="grab">⠿</span>
                <div class="issue-icon">✓</div>
                <div class="issue-main">
                  <a [routerLink]="['/projects', projectId, 'tasks', task.id]">{{ task.title }}</a>
                  <span>{{ task.description || 'No description provided' }}</span>
                </div>
                <em [class]="'priority ' + task.priority">{{ task.priority }}</em>
                <select [ngModel]="task.sprint_id || ''" (ngModelChange)="assign(task, $event)">
                  <option value="">Backlog</option>
                  @for (sprint of sprints(); track sprint.id) {
                    <option [value]="sprint.id">{{ sprint.name }}</option>
                  }
                </select>
              </article>
            } @empty {
              <p class="empty">No work items match these filters.</p>
            }
          </div>
        </section>

        <aside>
          <h3>Sprints</h3>
          @for (sprint of sprints(); track sprint.id) {
            <article>
              <b>{{ sprint.name }}</b>
              <span [class.active-sprint]="sprint.is_active">
                {{ sprint.is_active ? 'Active' : 'Planned' }}
              </span>
              <p>{{ sprint.goal || 'No goal set' }}</p>
            </article>
          } @empty {
            <p>Create a sprint from the project workspace.</p>
          }
        </aside>
      </div>
    </section>
  `,
  styles: [
    `
      .backlog {
        max-width: 1240px;
      }
      .backlog header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        margin-bottom: 20px;
      }
      .backlog header p {
        margin: 0;
        color: #6366f1;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.12em;
      }
      .backlog h2 {
        margin: 4px 0;
        font-size: 2rem;
      }
      .backlog header span {
        color: #64748b;
      }
      .backlog button {
        border: 0;
        border-radius: 9px;
        background: #4f46e5;
        color: #fff;
        padding: 10px 14px;
        font-weight: 700;
        cursor: pointer;
      }
      .create,
      .toolbar {
        display: flex;
        gap: 10px;
        margin: 12px 0;
        flex-wrap: wrap;
      }
      .create input,
      .toolbar input {
        flex: 1;
        min-width: 180px;
      }
      .create,
      .toolbar input,
      .toolbar select,
      .work-item select {
        padding: 9px;
        border: 1px solid #dbe5f1;
        border-radius: 8px;
        background: white;
      }
      .toolbar button {
        background: #fff;
        color: #475569;
        border: 1px solid #dbe5f1;
      }
      .toolbar button.active {
        background: #eef2ff;
        color: #4338ca;
      }
      .bulk-bar {
        display: flex;
        gap: 10px;
        align-items: center;
        padding: 10px 12px;
        background: #eef2ff;
        border-radius: 8px;
        margin: 8px 0;
      }
      .bulk-bar span {
        font-weight: 700;
        color: #4338ca;
      }
      .bulk-bar select {
        padding: 8px;
        border: 1px solid #dbe5f1;
        border-radius: 8px;
        background: #fff;
      }
      .bulk-bar button {
        background: #4f46e5;
        color: #fff;
        border: 0;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-weight: 600;
      }
      .bulk-bar button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .layout {
        display: grid;
        grid-template-columns: 1fr 270px;
        gap: 18px;
      }
      .work-list,
      aside {
        background: #fff;
        border: 1px solid #dbe5f1;
        border-radius: 14px;
      }
      .list-head {
        padding: 14px 16px;
        border-bottom: 1px solid #eef2f7;
        display: flex;
        justify-content: space-between;
      }
      .list-head span {
        color: #64748b;
        font-size: 0.8rem;
      }
      .work-item {
        display: grid;
        grid-template-columns: 20px 18px 26px 1fr auto 145px;
        gap: 10px;
        align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid #eef2f7;
        cursor: grab;
      }
      .work-item:active {
        cursor: grabbing;
      }
      .work-item.cdk-drag-preview {
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
        background: #fff;
        border-radius: 8px;
        opacity: 0.9;
      }
      .work-item.cdk-drag-placeholder {
        opacity: 0.3;
      }
      .grab {
        color: #94a3b8;
      }
      .issue-icon {
        background: #e0e7ff;
        color: #4338ca;
        border-radius: 6px;
        padding: 4px;
        text-align: center;
      }
      .issue-main {
        display: grid;
        gap: 4px;
      }
      .issue-main a {
        color: #0f172a;
        font-weight: 700;
        text-decoration: none;
      }
      .issue-main span,
      aside p {
        font-size: 0.8rem;
        color: #64748b;
      }
      .priority {
        font-style: normal;
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
      }
      .critical {
        color: #be123c;
      }
      .high {
        color: #ea580c;
      }
      .medium {
        color: #ca8a04;
      }
      .low {
        color: #0284c7;
      }
      aside {
        padding: 14px;
      }
      aside h3 {
        margin-top: 0;
      }
      aside article {
        padding: 12px 0;
        border-bottom: 1px solid #eef2f7;
      }
      aside article span {
        float: right;
        font-size: 0.7rem;
        color: #64748b;
      }
      .active-sprint {
        color: #059669 !important;
        font-weight: 700;
      }
      .empty {
        padding: 18px;
        color: #64748b;
      }
      @media (max-width: 800px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .work-item {
          grid-template-columns: 20px 18px 26px 1fr;
        }
        .work-item em,
        .work-item select {
          grid-column: 4;
        }
        .backlog header {
          align-items: start;
          gap: 12px;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class BacklogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tasksApi = inject(TaskService);
  private sprintsApi = inject(SprintService);
  private memberService = inject(ProjectMemberService);
  private toast = inject(ToastService);

  protected projectId = '';
  protected readonly tasks = signal<Task[]>([]);
  protected readonly sprints = signal<Sprint[]>([]);
  protected readonly members = signal<Member[]>([]);
  protected readonly creating = signal(false);
  protected readonly selectedIds = signal<string[]>([]);

  protected query = '';
  protected priority = '';
  protected status = '';
  protected assigneeId = '';
  protected onlyUnassigned = false;
  protected bulkSprintId = '';

  protected draft: Partial<Task> = { priority: 'medium' };

  protected readonly filtered = computed(() => {
    const q = this.query.toLowerCase();
    return this.tasks()
      .filter(
        (t) =>
          (!this.priority || t.priority === this.priority) &&
          (!this.status || t.status === this.status) &&
          (!this.assigneeId || t.assignee_id === this.assigneeId) &&
          (!this.onlyUnassigned || !t.sprint_id) &&
          `${t.title} ${t.description || ''}`.toLowerCase().includes(q),
      )
      .sort((a, b) => a.priority.localeCompare(b.priority));
  });

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.load();
  }

  protected create(): void {
    if (this.draft.title) {
      this.tasksApi.createTask(this.projectId, this.draft).subscribe({
        next: () => {
          this.draft = { priority: 'medium' };
          this.creating.set(false);
          this.loadTasks();
          this.toast.success('Task created');
        },
        error: () => this.toast.error('Failed to create task'),
      });
    }
  }

  protected assign(task: Task, sprintId: string): void {
    if (!sprintId) {
      this.tasksApi.updateTask(this.projectId, task.id, { sprint_id: null }).subscribe({
        next: () => this.loadTasks(),
        error: () => this.toast.error('Failed to unassign task'),
      });
      return;
    }
    this.sprintsApi.assign(this.projectId, sprintId, task.id).subscribe({
      next: () => this.loadTasks(),
      error: () => this.toast.error('Failed to assign task'),
    });
  }

  protected onReorder(event: CdkDragDrop<Task[]>): void {
    const current = this.filtered();
    moveItemInArray(current, event.previousIndex, event.currentIndex);
    this.tasks.set(current);
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

  protected clearSelection(): void {
    this.selectedIds.set([]);
    this.bulkSprintId = '';
  }

  protected bulkAssignSprint(): void {
    if (!this.bulkSprintId || this.selectedIds().length === 0) return;
    const ids = [...this.selectedIds()];
    let done = 0;
    ids.forEach((id) => {
      this.sprintsApi.assign(this.projectId, this.bulkSprintId, id).subscribe({
        next: () => {
          done += 1;
          if (done === ids.length) {
            this.clearSelection();
            this.loadTasks();
            this.toast.success(`Moved ${ids.length} tasks to sprint`);
          }
        },
        error: () => {
          done += 1;
          if (done === ids.length) {
            this.clearSelection();
            this.loadTasks();
            this.toast.error('Some tasks failed to move');
          }
        },
      });
    });
  }

  private load(): void {
    this.loadTasks();
    this.sprintsApi.list(this.projectId).subscribe((v) => this.sprints.set(v));
    this.memberService.members(this.projectId).subscribe((v) => this.members.set(v));
  }

  private loadTasks(): void {
    this.tasksApi.getTasks(this.projectId).subscribe((v) => this.tasks.set(v));
  }
}
