import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProjectDashboard, WorkspaceDashboard } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getProjectDashboard(projectId: string): Observable<ProjectDashboard> {
    return this.http.get<ProjectDashboard>(`${environment.apiBaseUrl}/projects/${projectId}/dashboard`);
  }

  getWorkspaceDashboard(): Observable<WorkspaceDashboard> {
    return this.http.get<WorkspaceDashboard>(`${environment.apiBaseUrl}/dashboard/workspace`);
  }
}
