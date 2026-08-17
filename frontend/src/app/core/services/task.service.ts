import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../models/app-models';

export interface TaskDetailResponse {
  task: Task;
  comments: Comment[];
  attachments: TaskAttachment[];
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  content_type?: string;
  size_bytes?: number;
  uploaded_by?: string;
  notes?: string;
  created_at: string;
}

export interface TaskFilterParams {
  status?: string;
  priority?: string;
  assignee_id?: string;
  sprint_id?: string;
  search?: string;
  due_before?: string;
  due_after?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  size?: number;
}

export interface TaskOverview {
  total_count: number;
  page: number;
  size: number;
  summary: string;
  tasks: Task[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/projects`;

  getTasks(projectId: string, filters?: TaskFilterParams): Observable<Task[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<Task[]>(`${this.apiUrl}/${projectId}/tasks`, { params });
  }

  getTask(projectId: string, taskId: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${projectId}/tasks/${taskId}`);
  }

  getTaskDetail(projectId: string, taskId: string): Observable<TaskDetailResponse> {
    return this.http.get<TaskDetailResponse>(`${this.apiUrl}/${projectId}/tasks/${taskId}/detail`);
  }

  getTaskOverview(projectId: string, filters?: TaskFilterParams): Observable<TaskOverview> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '')
          params = params.set(key, String(value));
      });
    }
    return this.http.get<TaskOverview>(`${this.apiUrl}/${projectId}/tasks/overview`, { params });
  }

  createTask(projectId: string, payload: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/${projectId}/tasks`, payload);
  }

  updateTask(projectId: string, taskId: string, payload: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/${projectId}/tasks/${taskId}`, payload);
  }

  deleteTask(projectId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/tasks/${taskId}`);
  }

  // Attachment methods
  uploadAttachment(
    projectId: string,
    taskId: string,
    file: File,
    notes?: string,
  ): Observable<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (notes) {
      formData.append('notes', notes);
    }
    return this.http.post<TaskAttachment>(
      `${this.apiUrl}/${projectId}/tasks/${taskId}/attachments`,
      formData,
    );
  }

  getAttachments(projectId: string, taskId: string): Observable<TaskAttachment[]> {
    return this.http.get<TaskAttachment[]>(
      `${this.apiUrl}/${projectId}/tasks/${taskId}/attachments`,
    );
  }

  deleteAttachment(projectId: string, taskId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${projectId}/tasks/${taskId}/attachments/${attachmentId}`,
    );
  }
}
