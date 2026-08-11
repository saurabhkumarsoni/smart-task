import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState } from './state';

export const selectTasksState = createFeatureSelector<TasksState>('tasks');

export const selectTasksLoading = createSelector(selectTasksState, (state) => state.loading);
export const selectTasksLoaded = createSelector(selectTasksState, (state) => state.loaded);
export const selectTasksError = createSelector(selectTasksState, (state) => state.error);

export const selectCurrentProjectId = createSelector(
  selectTasksState,
  (state) => state.currentProjectId,
);

export const selectTasksForCurrentProject = createSelector(
  selectTasksState,
  selectCurrentProjectId,
  (state, projectId) => {
    if (!projectId) {
      return [];
    }

    return state.byProjectId[projectId] ?? [];
  },
);
