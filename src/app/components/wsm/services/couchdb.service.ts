import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface CouchDbDocument {
  _id: string;
  _rev?: string;
  [key: string]: any;
}

export interface CouchDbResponse {
  ok: boolean;
  id: string;
  rev: string;
}

export interface LoginResponse {
  ok: boolean;
  name: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CouchdbService {
    isAuthenticated(): boolean {
      return !!this.authToken;
    }

    login(username: string, password: string): Observable<LoginResponse> {
      const url = `${this.baseUrl}/_session`;
      return this.http.post<LoginResponse>(url, { name: username, password }).pipe(
        tap((res: LoginResponse) => {
          if (res.ok) {
            this.authToken = 'dummy-token'; // Replace with real token logic
            this.currentUser$.next(username);
            localStorage.setItem('authToken', this.authToken);
          }
        })
      );
    }
  private baseUrl = environment.BASE_URL;
  private defaultDb = environment.DB_NAME;
  private authToken: string | null = null;
  private currentUser$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    // TODO: Restore session logic if needed
  }

  // ...existing code...
}
