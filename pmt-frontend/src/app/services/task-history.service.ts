import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TaskHistoryService {
  constructor(private http: HttpClient) {}

  list(projectId: string, taskId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/projects/${projectId}/tasks/${taskId}/history`);
  }
}
