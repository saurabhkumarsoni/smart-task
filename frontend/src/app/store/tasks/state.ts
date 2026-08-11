import { Task } from '../../core/models/app-models';

export interface TasksState {
  currentProjectId: string | null;
  byProjectId: Record<string, Task[]>;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialTasksState: TasksState = {
  currentProjectId: null,
  byProjectId: {},
  loading: false,
  loaded: false,
  error: null,
};
