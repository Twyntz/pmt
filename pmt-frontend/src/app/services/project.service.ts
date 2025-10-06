import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly base = '/api/projects';

  constructor(private http: HttpClient) {}

  // ------ projets ------
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(payload: { name: string; description?: string; startDate?: string; ownerId: string }): Observable<any> {
    const body = {
      name: payload.name ?? '',
      description: payload.description ?? '',
      startDate: payload.startDate ?? '',
      ownerId: payload.ownerId
    };
    return this.http.post<any>(this.base, body);
  }

  // ------ membres ------
  getMembers(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${projectId}/members`);
  }

  inviteMember(projectId: string, email: string, role: string = 'MEMBER'): Observable<any> {
    return this.http.post<any>(`${this.base}/${projectId}/invite`, { email, role });
  }
}
