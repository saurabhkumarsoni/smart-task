import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { loadTasksForProject, updateTaskOptimistic } from '../../../../store/tasks/actions';

import {
  selectTasksForCurrentProject,
  selectTasksLoading,
} from '../../../../store/tasks/selectors';

import { Task } from '../../../../core/models/app-models';

import { BoardHeaderComponent } from '../../components/board-header/board-header.component';
import { BoardColumnComponent } from '../../components/board-column/board-column.component';

export type BoardStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface BoardColumnConfig {
  key: BoardStatus;
  label: string;
  description: string;
}

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, BoardHeaderComponent, BoardColumnComponent],
  templateUrl: './project-board.component.html',
  styleUrl: './project-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectBoardPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  protected projectId = '';

  /**
   * Board columns.
   *
   * IMPORTANT:
   * These keys are also the values persisted to the API.
   */
  protected readonly columns: BoardColumnConfig[] = [
    {
      key: 'TODO',
      label: 'To Do',
      description: 'Tasks waiting to be started',
    },
    {
      key: 'IN_PROGRESS',
      label: 'In Progress',
      description: 'Currently being worked on',
    },
    {
      key: 'IN_REVIEW',
      label: 'In Review',
      description: 'Waiting for review or approval',
    },
    {
      key: 'DONE',
      label: 'Done',
      description: 'Completed work',
    },
  ];

  protected readonly loading$ = this.store.select(selectTasksLoading);

  protected readonly tasks = this.store.selectSignal(selectTasksForCurrentProject);

  protected readonly searchTerm = signal('');

  protected readonly selectedPriority = signal<string>('ALL');

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((projectId) => {
        this.projectId = projectId;

        if (projectId) {
          this.store.dispatch(
            loadTasksForProject({
              projectId,
            }),
          );
        }
      });
  }

  protected setSearch(value: string): void {
    this.searchTerm.set(value);
  }

  protected setPriority(value: string): void {
    this.selectedPriority.set(value);
  }

  protected tasksForColumn(status: BoardStatus): Task[] {
    const search = this.searchTerm().trim().toLowerCase();

    const priority = this.selectedPriority();

    return this.tasks().filter((task) => {
      const taskStatus = this.normalizeStatus(task.status);

      const matchesStatus =
        status === 'IN_REVIEW'
          ? taskStatus === 'IN_REVIEW' || taskStatus === 'REVIEW'
          : taskStatus === status;

      if (!matchesStatus) {
        return false;
      }

      if (priority !== 'ALL' && String(task.priority).toUpperCase() !== priority) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [task.title, task.description, task.assignee, task.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }

  /**
   * Handles a task being dropped into another column.
   *
   * The BoardColumnComponent should emit:
   *
   * {
   *   task: Task,
   *   toStatus: BoardStatus
   * }
   */
  protected onTaskDropped(event: { task: Task; toStatus: BoardStatus }): void {
    /**
     * Defensive check.
     *
     * This prevents:
     * Cannot read properties of undefined (reading 'status')
     */
    if (!event) {
      console.warn('[ProjectBoard] Drop event was undefined');
      return;
    }

    const task = event.task;
    const toStatus = event.toStatus;

    if (!task) {
      console.warn('[ProjectBoard] Drop event did not contain a task', event);
      return;
    }

    if (!toStatus) {
      console.warn('[ProjectBoard] Drop event did not contain a destination status', event);
      return;
    }

    if (!this.projectId) {
      console.warn('[ProjectBoard] Cannot update task without projectId');
      return;
    }

    const fromStatus = this.normalizeStatus(task.status);

    /**
     * Do nothing when dropping into the same column.
     */
    if (fromStatus === toStatus) {
      return;
    }

    /**
     * IMPORTANT:
     *
     * Do NOT convert:
     *
     * IN_PROGRESS -> IN PROGRESS
     *
     * or:
     *
     * IN_REVIEW -> IN REVIEW
     *
     * The API expects the same enum-style value used by
     * the loaded tasks.
     */
    const newStatus = this.persistedStatus(toStatus);

    console.debug('[ProjectBoard] Moving task', {
      taskId: task.id,
      fromStatus,
      toStatus: newStatus,
    });

    this.store.dispatch(
      updateTaskOptimistic({
        projectId: this.projectId,

        taskId: task.id,

        changes: {
          status: newStatus,
        },

        previousTask: {
          ...task,
        },
      }),
    );
  }

  protected trackColumn(_: number, column: BoardColumnConfig): string {
    return column.key;
  }

  /**
   * Normalizes values coming from the backend/UI.
   *
   * Supports:
   * TODO
   * IN_PROGRESS
   * IN PROGRESS
   * IN_REVIEW
   * IN REVIEW
   * REVIEW
   * DONE
   */
  private normalizeStatus(status?: string | null): string {
    return String(status ?? 'TODO')
      .trim()
      .replace(/\s+/g, '_')
      .toUpperCase();
  }

  /**
   * API persistence format.
   *
   * IMPORTANT:
   * The backend is currently rejecting "IN PROGRESS"
   * with HTTP 400.
   *
   * Therefore we persist enum-style values.
   */
  private persistedStatus(status: BoardStatus): string {
    return status;
  }
}
