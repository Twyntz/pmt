import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  /**
   * IMPORTANT
   * - On utilise des URLS RELATIVES pour bénéficier du proxy Nginx du front.
   * - Nginx doit proxyfier /api/ vers le backend (tu l’as déjà).
   */
  private readonly base = '/api/projects';

  constructor(private http: HttpClient) {}

  // ---------- LECTURE ----------
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  // ---------- CREATION ----------
  /**
   * payload attendu par le backend:
   * { name: string; description?: string; startDate?: 'YYYY-MM-DD'; ownerId: string }
   */
  create(payload: { name: string; description?: string; startDate?: string; ownerId: string }): Observable<any> {
    const body = {
      name: payload.name ?? '',
      description: payload.description ?? '',
      startDate: payload.startDate ?? '',   // <-- clé correcte
      ownerId: payload.ownerId
    };
    // Pas de fallback multi-origines : on laisse remonter l’erreur backend si 4xx/5xx
    return this.http.post<any>(this.base, body);
  }
}
