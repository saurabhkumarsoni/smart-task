import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project } from '../models/app-models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/projects`;

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl).pipe(catchError(() => of(this.demoProjects())));
  }

  getProject(projectId: string): Observable<Project> {
    return this.http
      .get<Project>(`${this.apiUrl}/${projectId}`)
      .pipe(
        catchError(() =>
          of(
            this.demoProjects().find((project) => project.id === projectId) ??
              this.demoProjects()[0],
          ),
        ),
      );
  }

  createProject(payload: Partial<Project>): Observable<Project> {
    return this.http
      .post<Project>(this.apiUrl, payload)
      .pipe(
        catchError(() =>
          of({
            ...payload,
            id: crypto.randomUUID(),
            progress: 0,
            tasksCount: 0,
            members: 1,
          } as Project),
        ),
      );
  }

  updateProject(projectId: string, payload: Partial<Project>): Observable<Project> {
    return this.http
      .put<Project>(`${this.apiUrl}/${projectId}`, payload)
      .pipe(catchError(() => of({ id: projectId, ...payload } as Project)));
  }

  deleteProject(projectId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}`).pipe(catchError(() => of()));
  }

  private demoProjects(): Project[] {
    return [
      {
        id: 'proj-1',
        name: 'Mobile Redesign',
        description: 'Refine onboarding and task collaboration flows.',
        owner: 'Ava',
        members: 6,
        progress: 78,
        tasksCount: 14,
      },
      {
        id: 'proj-2',
        name: 'Ops Automation',
        description: 'Automate recurring sprint planning and reporting.',
        owner: 'Noah',
        members: 4,
        progress: 52,
        tasksCount: 9,
      },
    ];
  }
}
