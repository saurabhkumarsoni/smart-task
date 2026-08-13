import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member, ProjectOverview } from '../models/app-models';

@Injectable({ providedIn: 'root' })
export class ProjectMemberService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/projects`;
  overview(id: string): Observable<ProjectOverview> { return this.http.get<ProjectOverview>(`${this.base}/${id}/overview`); }
  members(id: string): Observable<Member[]> { return this.http.get<Member[]>(`${this.base}/${id}/members`); }
  invite(id: string, user_id: string, role: Member['role']): Observable<Member> { return this.http.post<Member>(`${this.base}/${id}/members`, { user_id, role }); }
  updateRole(id: string, userId: string, role: Member['role']): Observable<Member> { return this.http.put<Member>(`${this.base}/${id}/members/${userId}`, { role }); }
  remove(id: string, userId: string): Observable<void> { return this.http.delete<void>(`${this.base}/${id}/members/${userId}`); }
}
