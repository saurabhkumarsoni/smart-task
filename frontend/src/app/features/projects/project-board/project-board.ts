import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TaskStatusColumnComponent } from '../../../features/tasks/components/task-status-column/task-status-column.component';
import { loadTasksForProject, updateTaskOptimistic } from '../../../store/tasks/actions';
import { selectTasksForCurrentProject, selectTasksLoading } from '../../../store/tasks/selectors';
import { Task } from '../../../core/models/app-models';

type BoardStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskStatusColumnComponent],
  template: `
    @if (loading$ | async) {
      <p class="loading">Loading board tasks...</p>
    }

    <div class="board" cdkDropListGroup>
      <div class="column" *ngFor="let column of columns">
        <app-task-status-column
          [title]="column.label"
          [statusKey]="column.key"
          [tasks]="tasksByColumn[column.key]()"
          (taskDropped)="onTaskDropped($event.task, $event.toStatus)"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .board {
        display: grid;
        grid-template-columns: repeat(4, minmax(220px, 1fr));
        gap: 16px;
      }
    `,
    `
      .loading {
        margin: 0 0 10px;
        color: #cbd5e1;
      }
    `,
  ],
})
export class ProjectBoardPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private currentProjectId = 'project-demo';

  protected readonly columns = [
    { key: 'TODO' as BoardStatus, label: 'TODO' },
    { key: 'IN_PROGRESS' as BoardStatus, label: 'IN PROGRESS' },
    { key: 'IN_REVIEW' as BoardStatus, label: 'IN REVIEW' },
    { key: 'DONE' as BoardStatus, label: 'DONE' },
  ] as const;

  protected readonly loading$ = this.store.select(selectTasksLoading);
  private readonly tasksSignal = this.store.selectSignal(selectTasksForCurrentProject);

  protected readonly tasksByColumn = {
    TODO: () => this.filterByStatus('TODO'),
    IN_PROGRESS: () => this.filterByStatus('IN_PROGRESS'),
    IN_REVIEW: () => this.filterByStatus('IN_REVIEW'),
    DONE: () => this.filterByStatus('DONE'),
  };

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? 'project-demo'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((projectId) => {
        this.currentProjectId = projectId;
        this.store.dispatch(loadTasksForProject({ projectId }));
      });
  }

  protected onTaskDropped(task: Task, toStatus: BoardStatus): void {
    const fromStatus = this.normalizeStatus(task.status);

    if (fromStatus === toStatus) {
      return;
    }

    this.store.dispatch(
      updateTaskOptimistic({
        projectId: this.currentProjectId,
        taskId: task.id,
        changes: {
          status: this.persistedStatus(toStatus),
        },
        previousTask: { ...task },
      }),
    );
  }

  private filterByStatus(status: BoardStatus) {
    const normalized = status.toUpperCase();
    const tasks = this.routeTasks();
    return tasks.filter((task) => {
      const taskStatus = this.normalizeStatus(task.status);

      if (normalized === 'IN_REVIEW') {
        return taskStatus === 'IN_REVIEW' || taskStatus === 'REVIEW';
      }

      return taskStatus === normalized;
    });
  }

  private routeTasks() {
    return this.tasksSignal();
  }

  private normalizeStatus(status?: string): string {
    return (status || 'TODO').replaceAll(' ', '_').toUpperCase();
  }

  private persistedStatus(status: BoardStatus): string {
    if (status === 'IN_PROGRESS') {
      return 'IN PROGRESS';
    }

    if (status === 'IN_REVIEW') {
      return 'IN REVIEW';
    }

    return status;
  }
}
