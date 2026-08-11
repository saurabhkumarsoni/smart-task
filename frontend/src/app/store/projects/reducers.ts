import { createReducer, on } from '@ngrx/store';
import { initialProjectsState } from './state';
import { loadProjects, loadProjectsFailure, loadProjectsSuccess } from './actions';

export const projectsReducer = createReducer(
  initialProjectsState,
  on(loadProjects, (state) => ({ ...state, loading: true, error: null })),
  on(loadProjectsSuccess, (state, { projects }) => ({
    ...state,
    items: projects,
    loading: false,
    loaded: true,
    error: null,
  })),
  on(loadProjectsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded: false,
    error,
  })),
);
