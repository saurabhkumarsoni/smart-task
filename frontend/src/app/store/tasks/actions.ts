import { createAction, props } from '@ngrx/store';
import { Task } from '../../core/models/app-models';

export const loadTasksForProject = createAction(
  '[Tasks] Load Tasks For Project',
  props<{ projectId: string }>(),
);

export const loadTasksForProjectSuccess = createAction(
  '[Tasks] Load Tasks For Project Success',
  props<{ projectId: string; tasks: Task[] }>(),
);

export const loadTasksForProjectFailure = createAction(
  '[Tasks] Load Tasks For Project Failure',
  props<{ projectId: string; error: string }>(),
);

export const updateTaskOptimistic = createAction(
  '[Tasks] Update Task Optimistic',
  props<{
    projectId: string;
    taskId: string;
    changes: Partial<Task>;
    previousTask: Task;
  }>(),
);

export const updateTaskSuccess = createAction(
  '[Tasks] Update Task Success',
  props<{ projectId: string; task: Task }>(),
);

export const updateTaskFailure = createAction(
  '[Tasks] Update Task Failure',
  props<{ projectId: string; previousTask: Task; error: string }>(),
);
