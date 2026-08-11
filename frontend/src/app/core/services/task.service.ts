import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../models/app-models';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/projects`;

  getTasks(projectId: string): Observable<Task[]> {
    return this.http
      .get<Task[]>(`${this.apiUrl}/${projectId}/tasks`)
      .pipe(catchError(() => of(this.demoTasks(projectId))));
  }

  getTask(projectId: string, taskId: string): Observable<Task> {
    return this.http
      .get<Task>(`${this.apiUrl}/${projectId}/tasks/${taskId}`)
      .pipe(
        catchError(() =>
          of(
            this.demoTasks(projectId).find((task) => task.id === taskId) ??
              this.demoTasks(projectId)[0],
          ),
        ),
      );
  }

  createTask(projectId: string, payload: Partial<Task>): Observable<Task> {
    return this.http
      .post<Task>(`${this.apiUrl}/${projectId}/tasks`, payload)
      .pipe(
        catchError(() =>
          of({ ...payload, id: crypto.randomUUID(), status: 'TODO', priority: 'Medium' } as Task),
        ),
      );
  }

  updateTask(projectId: string, taskId: string, payload: Partial<Task>): Observable<Task> {
    return this.http
      .patch<Task>(`${this.apiUrl}/${projectId}/tasks/${taskId}`, payload)
      .pipe(catchError(() => of({ id: taskId, ...payload } as Task)));
  }

  deleteTask(projectId: string, taskId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${projectId}/tasks/${taskId}`)
      .pipe(catchError(() => of()));
  }

  private demoTasks(projectId: string): Task[] {
    return [
      {
        id: 'task-1',
        title: 'Review design system',
        description: 'Audit onboarding screens for consistency.',
        status: 'TODO',
        priority: 'High',
        assignee: 'Ava',
        projectId,
      },
      {
        id: 'task-2',
        title: 'Fix onboarding flow',
        description: 'Resolve empty state messages.',
        status: 'IN PROGRESS',
        priority: 'Medium',
        assignee: 'Noah',
        projectId,
      },
      {
        id: 'task-3',
        title: 'Prepare sprint summary',
        description: 'Gather metrics for the team review.',
        status: 'DONE',
        priority: 'Low',
        assignee: 'Mina',
        projectId,
      },
    ];
  }
}
