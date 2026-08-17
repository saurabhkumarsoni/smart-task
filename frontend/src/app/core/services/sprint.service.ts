import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sprint } from '../models/app-models';

@Injectable({ providedIn: 'root' })
export class SprintService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/projects`;
  list(projectId: string): Observable<Sprint[]> {
    return this.http.get<Sprint[]>(`${this.base}/${projectId}/sprints`);
  }
  create(projectId: string, data: Partial<Sprint>): Observable<Sprint> {
    return this.http.post<Sprint>(`${this.base}/${projectId}/sprints`, data);
  }
  update(projectId: string, sprintId: string, data: Partial<Sprint>): Observable<Sprint> {
    return this.http.put<Sprint>(`${this.base}/${projectId}/sprints/${sprintId}`, data);
  }
  assign(projectId: string, sprintId: string, taskId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${this.base}/${projectId}/sprints/${sprintId}/tasks/${taskId}`,
      {},
    );
  }
}
