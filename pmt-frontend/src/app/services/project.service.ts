import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  // API: ton back expose /api/projects (et on garde des alias en fallback)
  private readonly tries = [
    'http://localhost:8080/api/projects',
    'http://localhost:8080/projects',      // alias si tu actives aussi /projects côté back (cf. ci-dessous)
    'http://localhost:8080/api/v1/projects'
  ];

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    const tryAt = (i: number): Observable<any[]> => {
      if (i >= this.tries.length) return of([]);
      const url = this.tries[i];
      return this.http.get<any[]>(url).pipe(
        catchError(() => tryAt(i + 1))
      );
    };
    return tryAt(0);
  }

  getById(id: string): Observable<any> {
    // même logique : on tente les URLs dans l'ordre
    const tryAt = (i: number): Observable<any> => {
      if (i >= this.tries.length) return of(null);
      const url = `${this.tries[i]}/${id}`;
      return this.http.get<any>(url).pipe(
        catchError(() => tryAt(i + 1))
      );
    };
    return tryAt(0);
  }
}
