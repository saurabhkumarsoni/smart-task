import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ProjectService } from '../../core/services/project.service';
import { loadProjects, loadProjectsFailure, loadProjectsSuccess } from './actions';

@Injectable()
export class ProjectsEffects {
  private readonly actions$ = inject(Actions);
  private readonly projectService = inject(ProjectService);

  readonly loadProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadProjects),
      switchMap(() =>
        this.projectService.getProjects().pipe(
          map((projects) => loadProjectsSuccess({ projects })),
          catchError(() => of(loadProjectsFailure({ error: 'Failed to load projects from API.' }))),
        ),
      ),
    ),
  );
}
