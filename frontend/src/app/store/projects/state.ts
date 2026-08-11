import { Project } from '../../core/models/app-models';

export interface ProjectsState {
  items: Project[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialProjectsState: ProjectsState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
};
