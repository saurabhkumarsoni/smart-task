import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProjectsState } from './state';

export const selectProjectsState = createFeatureSelector<ProjectsState>('projects');

export const selectProjects = createSelector(selectProjectsState, (state) => state.items);
export const selectProjectsLoading = createSelector(selectProjectsState, (state) => state.loading);
export const selectProjectsLoaded = createSelector(selectProjectsState, (state) => state.loaded);
export const selectProjectsError = createSelector(selectProjectsState, (state) => state.error);
