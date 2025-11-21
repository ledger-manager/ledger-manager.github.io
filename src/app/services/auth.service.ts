import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CouchDBSessionResponse } from './couchdb.service';
import { environment } from '../../environments/environment';

interface StoredSession {
  name: string;
  roles: string[];
  loginTime: number;
  expiresAt: number;
  _password?: string; // Store user-supplied password for local testing
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly SESSION_KEY = 'mc_manager_session';
  private readonly SESSION_DURATION = 15 * 24 * 60 * 60 * 1000; // 15 days in milliseconds
  private readonly RETURN_URL_KEY = 'mc_manager_return_url';

  constructor(private router: Router) {}

  /**
   * Store session information after successful login
   */
  setSession(session: CouchDBSessionResponse, password?: string): void {
    const now = Date.now();
    // Use expiration from CouchDB cookie if available, otherwise use default duration
    const expiresAt = (session as any).expiresAt || (now + this.SESSION_DURATION);
    const storedSession: StoredSession = {
      name: session.name || '',
      roles: session.roles,
      loginTime: now,
      expiresAt: expiresAt,
      _password: password // Store password for local testing
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(storedSession));
  }

  /**
   * Get stored session if it exists and is valid
   */
  getSession(): StoredSession | null {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return null;

    try {
      const session: StoredSession = JSON.parse(sessionStr);
      
      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      this.clearSession();
      return null;
    }
  }

  /**
   * Check if user is logged in with valid session
   */
  isLoggedIn(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Get the logged-in username
   */
  getUsername(): string | null {
    const session = this.getSession();
    return session?.name || null;
  }

  /**
   * Get user roles
   */
  getUserRoles(): string[] {
    const session = this.getSession();
    return session?.roles || [];
  }

  /**
   * Update session expiration time (call this on user activity)
   * Note: With CouchDB cookie-based auth, we rely on the cookie expiration
   * This method is kept for compatibility but doesn't extend the session
   */
  refreshSession(): void {
    const session = this.getSession();
    if (!session) {
      this.logout();
    }
  }

  /**
   * Clear session and logout
   */
  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.RETURN_URL_KEY);
  }

  /**
   * Logout and redirect to login page
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Store the URL to return to after login
   */
  setReturnUrl(url: string): void {
    localStorage.setItem(this.RETURN_URL_KEY, url);
  }

  /**
   * Get the return URL
   */
  getReturnUrl(): string | null {
    const url = localStorage.getItem(this.RETURN_URL_KEY);
    localStorage.removeItem(this.RETURN_URL_KEY);
    return url;
  }

  /**
   * Check if session is about to expire (within 1 minute)
   */
  isSessionExpiringSoon(): boolean {
    const session = this.getSession();
    if (!session) return false;
    
    const timeUntilExpiry = session.expiresAt - Date.now();
    return timeUntilExpiry < 60000; // Less than 1 minute
  }

  /**
   * Check if user is admin (username is 'sridhar_admin' or roles include 'admin')
   */
  isAdmin(): boolean {
    const session = this.getSession();
    if (!session) return false;
    return session.name === 'sridhar_admin' || (session.roles && session.roles.includes('admin'));
  }
}
