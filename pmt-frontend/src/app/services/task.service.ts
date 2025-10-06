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
  assigneeEmail?: string | null; // encore supporté en fallback si besoin
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  list(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/projects/${projectId}/tasks`);
  }

  create(projectId: string, payload: TaskPayload): Observable<any> {
    const body = {
      title: payload.title ?? '',
      description: payload.description ?? '',
      status: (payload.status ?? 'TODO') as TaskStatus,
      priority: (payload.priority ?? 'MEDIUM') as TaskPriority,
      deadline: payload.deadline ?? '',
      endDate: payload.endDate ?? '',
      assigneeId: payload.assigneeId ?? null,
      assigneeEmail: payload.assigneeEmail ?? '' // toléré côté back
    };
    return this.http.post<any>(`/api/projects/${projectId}/tasks`, body);
  }
}
