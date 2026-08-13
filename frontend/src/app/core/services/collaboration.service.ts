import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Comment, Notification, TaskHistory } from '../models/app-models';

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  comments(projectId: string, taskId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/projects/${projectId}/tasks/${taskId}/comments`);
  }
  addComment(projectId: string, taskId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/projects/${projectId}/tasks/${taskId}/comments`, {
      content,
    });
  }
  updateComment(
    projectId: string,
    taskId: string,
    id: string,
    content: string,
  ): Observable<Comment> {
    return this.http.patch<Comment>(
      `${this.base}/projects/${projectId}/tasks/${taskId}/comments/${id}`,
      { content },
    );
  }
  deleteComment(projectId: string, taskId: string, id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/projects/${projectId}/tasks/${taskId}/comments/${id}`,
    );
  }
  history(projectId: string, taskId: string): Observable<TaskHistory[]> {
    return this.http.get<TaskHistory[]>(
      `${this.base}/projects/${projectId}/tasks/${taskId}/history`,
    );
  }
  notifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/notifications`);
  }
  notificationSummary(): Observable<{ unread_count: number; total_count: number; digest: string }> {
    return this.http.get<{ unread_count: number; total_count: number; digest: string }>(
      `${this.base}/notifications/summary`,
    );
  }
  markRead(id: string): Observable<Notification> {
    return this.http.post<Notification>(`${this.base}/notifications/${id}/read`, {});
  }
}
