import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  /** IMPORTANT : on reste en chemin relatif => Nginx proxy vers backend */
  private readonly usersUrl = '/users';
  private readonly storageKey = 'pmt_user';

  constructor(private http: HttpClient) {}

  // ---------- Session ----------
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

  // ---------- Helpers ----------
  /** Spring Data REST: GET /users -> { _embedded: { users: [...] } } */
  private fetchUsers(): Observable<any[]> {
    return this.http.get<any>(this.usersUrl).pipe(
      map((resp: any) => Array.isArray(resp?._embedded?.users) ? resp._embedded.users : [])
    );
  }

  /** Extrait l'id depuis le self link HAL (/users/{id}) */
  private extractId(u: any): string | null {
    const href = u?._links?.self?.href || '';
    const m = href.match(/\/users\/([^/?#]+)$/);
    return m ? m[1] : null;
  }

  /** Normalise l’entête Location renvoyée par Spring Data REST vers un chemin /users/{id} utilisable côté front */
  private normalizeLocationToPath(location: string | null): string | null {
    if (!location) return null;
    try {
      // si c'est une URL absolue (http://backend:8080/users/xxx), on ne garde que le path
      const url = new URL(location);
      return url.pathname;
    } catch {
      // déjà un path relatif
      return location;
    }
  }

  // ---------- Auth "simpifiée" ----------
  /**
   * Login "dév" : on va chercher l’utilisateur dans /users et on compare email & password.
   * (À remplacer par un vrai /api/auth/login dès que tu as un contrôleur dédié.)
   */
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

  /**
   * Enregistre un user via Spring Data REST: POST /users
   * - Retourne le body si le backend le renvoie (certaines confs renvoient l’entité créée),
   * - Sinon suit l’entête Location pour GET /users/{id},
   * - Sauvegarde la session locale (id/email/username) pour enchaîner direct.
   */
  register(payload: { username: string; email: string; password: string | null | undefined }): Observable<any> {
    const body = {
      username: payload.username ?? '',
      email: payload.email ?? '',
      password: payload.password ?? ''
    };

    return this.http
      .post<any>(this.usersUrl, body, { observe: 'response' })
      .pipe(
        switchMap(res => {
          // 1) Si le back renvoie le JSON créé, on l'utilise
          const created = res.body;
          if (created && created._links?.self?.href) {
            return of(created);
          }

          // 2) Sinon on suit Location
          const locPath = this.normalizeLocationToPath(res.headers.get('Location'));
          if (locPath) {
            return this.http.get<any>(locPath);
          }

          // 3) À défaut, on retente en listant /users et en retrouvant par email
          return this.fetchUsers().pipe(
            map(users => users.find(u => u.email === body.email) || null)
          );
        }),
        map(user => {
          // Si on a pu récupérer l'utilisateur, on initialise la session locale
          if (user) {
            const session = {
              id: this.extractId(user),
              email: user.email,
              username: user.username,
              role: 'USER'
            };
            localStorage.setItem(this.storageKey, JSON.stringify(session));
          }
          return user;
        })
      );
  }
}
