import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CouchDBResponse<T> {
  id: string;
  key: string;
  value: {
    rev: string;
  };
  doc?: T;
}

export interface CouchDBPutResponse {
  ok: boolean;
  id: string;
  rev: string;
}

export interface CouchDBSessionResponse {
  ok: boolean;
  name: string | null;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CouchdbService {
  private baseUrl = environment.BASE_URL;
  private dbName = environment.DB_NAME;
  private dbUrl = `${this.baseUrl}/${this.dbName}`;

  constructor(private http: HttpClient) {}

  /**
   * Get a document from CouchDB by ID
   * @param documentId The document ID to retrieve
   * @returns Observable of the document
   */
  getDocument<T>(documentId: string): Observable<T> {
    const url = `${this.dbUrl}/${documentId}`;
    // Only use session/cookie after login
    return this.http.get<T>(url, { withCredentials: true });
  }

  /**
   * Put (create or update) a document in CouchDB
   * @param documentId The document ID
   * @param dataObject The document data to store
   * @returns Observable of the put response
   */
  putDocument<T>(documentId: string, dataObject: T): Observable<CouchDBPutResponse> {
    const url = `${this.dbUrl}/${documentId}`;
    // Only use session/cookie after login
    return this.http.put<CouchDBPutResponse>(url, dataObject, { withCredentials: true });
  }

  /**
   * Login to CouchDB and create a session
   * @param username The username
   * @param password The password
   * @returns Observable of the session response
   */
  login(username: string, password: string): Observable<CouchDBSessionResponse> {
    const url = `${this.baseUrl}/_session`;
    const body = {
      name: username,
      password: password
    };
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<CouchDBSessionResponse>(url, body, { 
      headers,
      withCredentials: true,
      observe: 'response'
    }).pipe(
      map(response => {
        // NOTE: Browsers don't expose Set-Cookie header to JavaScript for security reasons
        // The cookie is still set by the browser, but we can't read the expiration from it
        // Extract session expiration from Set-Cookie header (will be null in browsers)
        const setCookieHeader = response.headers.get('Set-Cookie');
        let expiresAt: number | null = null;
        
        if (setCookieHeader) {
          const expiresMatch = setCookieHeader.match(/Expires=([^;]+)/);
          if (expiresMatch) {
            const expiresDate = new Date(expiresMatch[1]);
            expiresAt = expiresDate.getTime();
          }
        }
        
        // Attach expiration time to response (will be null, fallback to SESSION_DURATION in AuthService)
        const sessionResponse = response.body as CouchDBSessionResponse;
        (sessionResponse as any).expiresAt = expiresAt;
        
        return sessionResponse;
      })
    );
  }

  /**
   * Get current session info
   * @returns Observable of the current session
   */
  getSession(): Observable<CouchDBSessionResponse> {
    const url = `${this.baseUrl}/_session`;
    // Only use session/cookie after login
    return this.http.get<CouchDBSessionResponse>(url, { withCredentials: true });
  }

  /**
   * Logout from CouchDB (delete session)
   * @returns Observable of the logout response
   */
  logout(): Observable<any> {
    const url = `${this.baseUrl}/_session`;
    // Only use session/cookie after login
    return this.http.delete(url, { withCredentials: true });
  }
}
