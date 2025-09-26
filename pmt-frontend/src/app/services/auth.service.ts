import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  
  private readonly usersUrl = '/users';
  private readonly storageKey = 'pmt_user';

  constructor(private http: HttpClient) {}

  
  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.storageKey);
  }

  getCurrentUser(): any {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || 'null');
    } catch {
      return null;
    }
  }

  
  private fetchUsers(): Observable<any[]> {
    return this.http.get<any>(this.usersUrl).pipe(
      map((resp: any) => Array.isArray(resp?._embedded?.users) ? resp._embedded.users : [])
    );
  }

  login(email: string, password: string): Observable<any> {
    if (!email || !password) return of(null);

    return this.fetchUsers().pipe(
      map((users: any[]) => {
        const u = users.find(x => x.email === email && x.password === password);
        if (!u) return null;

        const session = {
          id: this.extractId(u),
          email: u.email,
          username: u.username,
          role: 'USER'
        };
        localStorage.setItem(this.storageKey, JSON.stringify(session));
        return session;
      })
    );
  }

  private extractId(u: any): string | null {
    const href = u?._links?.self?.href || '';
    const m = href.match(/\/users\/(.+)$/);
    return m ? m[1] : null;
  }

  /**
   * Crée un utilisateur via le contrôleur backend dédié.
   * Retourne le body JSON (UserDTO) ou un objet { location } depuis l'entête Location.
   */
  register(payload: { username: string; email: string; password: string | null | undefined }): Observable<any> {
    const body = {
      username: payload.username ?? '',
      email: payload.email ?? '',
      password: payload.password ?? ''
    };

    return this.http
      .post<any>('/api/auth/register', body, { observe: 'response' })
      .pipe(map(res => res.body ?? { location: res.headers.get('Location') }));
  }
}
