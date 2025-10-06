import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string;   // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  assigneeId?: string | null;
  assigneeEmail?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  list(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/projects/${projectId}/tasks`);
  }

  get(projectId: string, taskId: string): Observable<any> {
    return this.http.get<any>(`/api/projects/${projectId}/tasks/${taskId}`);
  }

  create(projectId: string, payload: TaskPayload): Observable<any> {
    return this.http.post<any>(`/api/projects/${projectId}/tasks`, payload);
  }

  /** Mise à jour partielle (PATCH) */
  update(projectId: string, taskId: string, payload: Partial<TaskPayload>): Observable<any> {
    return this.http.patch<any>(`/api/projects/${projectId}/tasks/${taskId}`, payload);
  }
}
