import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member, Organization } from '../models/app-models';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/organizations`;
  list(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.url);
  }
  create(data: Pick<Organization, 'name' | 'slug' | 'description'>): Observable<Organization> {
    return this.http.post<Organization>(this.url, data);
  }
  update(id: string, data: Partial<Organization>): Observable<Organization> {
    return this.http.put<Organization>(`${this.url}/${id}`, data);
  }
  members(id: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.url}/${id}/members`);
  }
  invite(id: string, user_id: string, role: Member['role']): Observable<Member> {
    return this.http.post<Member>(`${this.url}/${id}/members`, { user_id, role });
  }
  updateRole(id: string, userId: string, role: Member['role']): Observable<Member> {
    return this.http.put<Member>(`${this.url}/${id}/members/${userId}`, { role });
  }
}
