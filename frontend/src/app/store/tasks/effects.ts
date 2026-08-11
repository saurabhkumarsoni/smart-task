import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { TaskService } from '../../core/services/task.service';
import {
  loadTasksForProject,
  loadTasksForProjectFailure,
  loadTasksForProjectSuccess,
  updateTaskFailure,
  updateTaskOptimistic,
  updateTaskSuccess,
} from './actions';

@Injectable()
export class TasksEffects {
  private readonly actions$ = inject(Actions);
  private readonly taskService = inject(TaskService);

  readonly loadTasksForProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTasksForProject),
      switchMap(({ projectId }) =>
        this.taskService.getTasks(projectId).pipe(
          map((tasks) => loadTasksForProjectSuccess({ projectId, tasks })),
          catchError(() =>
            of(loadTasksForProjectFailure({ projectId, error: 'Failed to load project tasks.' })),
          ),
        ),
      ),
    ),
  );

  readonly updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateTaskOptimistic),
      switchMap(({ projectId, taskId, changes, previousTask }) =>
        this.taskService.updateTask(projectId, taskId, changes).pipe(
          map((task) => updateTaskSuccess({ projectId, task })),
          catchError(() =>
            of(
              updateTaskFailure({
                projectId,
                previousTask,
                error: 'Failed to save task update. Rolled back local state.',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
