import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface CreateProjectPayload {
  name: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD
  ownerId?: string;   // optionnel, côté back tu peux le dériver de l'auth
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  // Priorité: proxy Nginx, puis URLs directes (utile hors Docker)
  private readonly projectRoots = [
    '/api/projects',
    'http://localhost:8080/api/projects',
    'http://localhost:8080/projects',
    'http://localhost:8080/api/v1/projects'
  ];

  private readonly userRoots = [
    '/api/users',
    'http://localhost:8080/api/users',
    'http://localhost:8080/users',
    'http://localhost:8080/api/v1/users'
  ];

  constructor(private http: HttpClient) {}

  // -------- Projects
  getAll(): Observable<any[]> {
    const tryAt = (i: number): Observable<any[]> => {
      if (i >= this.projectRoots.length) return of([]);
      return this.http.get<any[]>(this.projectRoots[i]).pipe(
        catchError(() => tryAt(i + 1))
      );
    };
    return tryAt(0);
  }

  getById(id: string): Observable<any> {
    const tryAt = (i: number): Observable<any> => {
      if (i >= this.projectRoots.length) return of(null);
      return this.http.get<any>(`${this.projectRoots[i]}/${id}`).pipe(
        catchError(() => tryAt(i + 1))
      );
    };
    return tryAt(0);
  }

  /** Création d'un projet */
  create(payload: CreateProjectPayload): Observable<any> {
    const tryAt = (i: number): Observable<any> => {
      if (i >= this.projectRoots.length) return of(null);
      return this.http.post<any>(this.projectRoots[i], payload).pipe(
        catchError(() => tryAt(i + 1))
      );
    };
    return tryAt(0);
  }

  // -------- Members (si ces routes existent côté back)
  getMembers(projectId: string): Observable<any[]> {
    const paths = this.projectRoots.map(p => `${p}/${projectId}/members`);
    const tryAt = (i: number): Observable<any[]> => {
      if (i >= paths.length) return of([]);
      return this.http.get<any[]>(paths[i]).pipe(
        catchError(() => tryAt(i + 1))
      );
    };
    return tryAt(0);
  }

  inviteMember(projectId: string, email: string, role: string): Observable<any> {
    const paths = this.projectRoots.map(p => `${p}/${projectId}/invite`);
    const body = { email, role };
    const tryAt = (i: number): Observable<any> => {
      if (i >= paths.length) return of(null);
      return this.http.post<any>(paths[i], body).pipe(
        catchError(() => tryAt(i + 1))
      );
    };
    return tryAt(0);
  }

  // -------- Users
  getUserById(userId: string): Observable<any> {
    const tryAt = (i: number): Observable<any> => {
      if (i >= this.userRoots.length) return of(null);
      return this.http.get<any>(`${this.userRoots[i]}/${userId}`).pipe(
        catchError(() => tryAt(i + 1))
      );
    };
    return tryAt(0);
  }
}
