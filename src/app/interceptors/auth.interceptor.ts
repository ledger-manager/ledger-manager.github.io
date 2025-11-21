import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ...existing code...
    
    // Check if session has expired before making request
    if (!this.authService.isLoggedIn() && !req.url.includes('/_session') && !this.router.url.includes('/login')) {
      // Session expired, redirect to login
      this.authService.setReturnUrl(this.router.url);
      this.router.navigate(['/login']);
      return throwError(() => new Error('Session expired'));
    }

    // Clone request and add credentials + headers for Ngrok compatibility
    let headers = req.headers;

    // Add Accept header if not present
    if (!headers.has('Accept')) {
      headers = headers.set('Accept', 'application/json');
    }

    // Add Ngrok bypass header
    headers = headers.set('ngrok-skip-browser-warning', 'true');

    // Add Content-Type for POST/PUT requests if not already set
    if ((req.method === 'POST' || req.method === 'PUT') && !headers.has('Content-Type')) {
      headers = headers.set('Content-Type', 'application/json');
    }

    // Conditionally add Basic Auth for local testing
    // Assume AuthService stores credentials after login (e.g., in session)
    const session = this.authService.getSession();
    if (!environment.production && session && session.name && session._password) {
      const basicAuth = btoa(`${session.name}:${session._password}`);
      headers = headers.set('Authorization', `Basic ${basicAuth}`);
    }

    // ...existing code...
    // ...existing code...
    console.log('🔹 With credentials:', true);

    const authReq = req.clone({
      withCredentials: true,
      headers: headers
    });
    
    console.log('🔹 Final cloned request headers:', authReq.headers.keys());
    console.log('🔹 Final ngrok-skip-browser-warning:', authReq.headers.get('ngrok-skip-browser-warning'));

    return next.handle(authReq).pipe(
      tap(event => {
        // Check if response is HTML instead of JSON (Ngrok warning page)
        if (event instanceof HttpResponse) {
          console.log('✅ Response received:', event.status, event.url);
          const contentType = event.headers.get('Content-Type') || '';
          console.log('✅ Content-Type:', contentType);
          
          // Log ALL response headers for debugging
          console.log('✅ Response headers:');
          event.headers.keys().forEach(key => {
            console.log(`   ${key}: ${event.headers.get(key)}`);
          });
          
          if (contentType.includes('text/html') && event.body && typeof event.body === 'string') {
            if (event.body.includes('ngrok') || event.body.includes('ERR_NGROK')) {
              console.error('❌ Received Ngrok warning page instead of API response');
              throw new Error('Ngrok warning page detected. Please open the Ngrok URL in browser first.');
            }
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Request failed:', error.status, error.statusText, error.url);
        console.error('❌ Error headers:', error.headers);
        console.error('❌ Full error object:', error);
        
        // Handle Ngrok HTML response
        if (error.error && typeof error.error === 'string' && 
            (error.error.includes('ngrok') || error.error.includes('ERR_NGROK'))) {
          console.error('❌ Ngrok warning page detected:', error.error.substring(0, 200));
          return throwError(() => new Error('Ngrok tunnel warning page. Please visit the Ngrok URL in browser first to bypass the warning.'));
        }

        // Handle network errors
        if (error.status === 0) {
          console.error('❌ Network error - possibly Ngrok tunnel issue or CORS');
        }

        // Handle 401 Unauthorized errors (session expired or not authenticated)
        if (error.status === 401) {
          console.error('❌ 401 Unauthorized - Cookie not sent or invalid');
          this.authService.clearSession();
          
          // Don't redirect if already on login page or if it's a login request
          if (!this.router.url.includes('/login')) {
            this.authService.setReturnUrl(this.router.url);
            this.router.navigate(['/login']);
          }
        }

        return throwError(() => error);
      })
    );
  }
}
