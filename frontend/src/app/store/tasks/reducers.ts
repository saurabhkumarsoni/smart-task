import { createReducer, on } from '@ngrx/store';
import {
  loadTasksForProject,
  loadTasksForProjectFailure,
  loadTasksForProjectSuccess,
  updateTaskFailure,
  updateTaskOptimistic,
  updateTaskSuccess,
} from './actions';
import { initialTasksState } from './state';
import { Task } from '../../core/models/app-models';

function updateTaskById(tasks: Task[], taskId: string, updater: (task: Task) => Task): Task[] {
  return tasks.map((task) => (task.id === taskId ? updater(task) : task));
}

function mergeTaskById(tasks: Task[], incoming: Task): Task[] {
  return updateTaskById(tasks, incoming.id, (task) => ({ ...task, ...incoming }));
}

function replaceTaskById(tasks: Task[], incoming: Task): Task[] {
  return updateTaskById(tasks, incoming.id, () => incoming);
}

export const tasksReducer = createReducer(
  initialTasksState,
  on(loadTasksForProject, (state, { projectId }) => ({
    ...state,
    currentProjectId: projectId,
    loading: true,
    error: null,
  })),
  on(loadTasksForProjectSuccess, (state, { projectId, tasks }) => ({
    ...state,
    loading: false,
    loaded: true,
    error: null,
    byProjectId: {
      ...state.byProjectId,
      [projectId]: tasks,
    },
  })),
  on(loadTasksForProjectFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded: false,
    error,
  })),
  on(updateTaskOptimistic, (state, { projectId, taskId, changes }) => ({
    ...state,
    byProjectId: {
      ...state.byProjectId,
      [projectId]: updateTaskById(state.byProjectId[projectId] ?? [], taskId, (task) => ({
        ...task,
        ...changes,
      })),
    },
  })),
  on(updateTaskSuccess, (state, { projectId, task }) => ({
    ...state,
    error: null,
    byProjectId: {
      ...state.byProjectId,
      [projectId]: mergeTaskById(state.byProjectId[projectId] ?? [], task),
    },
  })),
  on(updateTaskFailure, (state, { projectId, previousTask, error }) => ({
    ...state,
    error,
    byProjectId: {
      ...state.byProjectId,
      [projectId]: replaceTaskById(state.byProjectId[projectId] ?? [], previousTask),
    },
  })),
);
