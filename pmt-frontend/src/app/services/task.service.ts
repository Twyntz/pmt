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
  deadline?: string;           // YYYY-MM-DD
  endDate?: string;            // YYYY-MM-DD
  assigneeId?: string | null;  // UUID ou null
  assigneeEmail?: string | null;
  changedBy?: string | null;   // UUID de l'utilisateur qui modifie (optionnel)
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  list(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/projects/${projectId}/tasks`);
  }

  get(projectId: string, taskId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/projects/${projectId}/tasks/${taskId}`);
  }

  create(projectId: string, payload: TaskPayload): Observable<any> {
    return this.http.post<any>(`${this.base}/projects/${projectId}/tasks`, payload);
  }

  update(projectId: string, taskId: string, payload: Partial<TaskPayload>): Observable<any> {
    return this.http.patch<any>(`${this.base}/projects/${projectId}/tasks/${taskId}`, payload);
  }
}
