import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse, AuthResponse, RegisterPayload, User } from '../models/app-models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  private readonly storageKey = 'smart-task-auth';

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, payload)
      .pipe(tap((response) => this.storeAuth(response)));
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, payload);
  }

  logout(): Observable<{ message: string }> {
    const token = this.getRefreshToken();
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/auth/logout`, { refresh_token: token })
      .pipe(
        catchError(() => of({ message: 'Logged out locally' })),
        tap(() => this.clearAuth()),
      );
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getRefreshToken();
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refresh_token: token })
      .pipe(tap((response) => this.storeAuth(response)));
  }

  forgotPassword(email: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(payload: { token: string; new_password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/reset-password`, payload);
  }

  verifyEmail(token: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/verify-email`, { token });
  }

  updateProfile(payload: {
    username: string;
    first_name: string;
    last_name: string;
  }): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}/auth/me`, payload)
      .pipe(tap((user) => this.updateStoredUser(user)));
  }

  changePassword(payload: { current_password: string; new_password: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/change-password`, payload);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  adminCheck(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/admin-check`);
  }

  activateAccount(targetEmail: string, isActive: boolean): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/activate-account`, {
      target_email: targetEmail,
      is_active: isActive,
    });
  }

  getProfile(): Observable<User | null> {
    return of(this.currentUser());
  }

  syncCurrentUser(): Observable<User | null> {
    if (!this.getAccessToken()) {
      return of(null);
    }

    return this.getMe().pipe(
      tap((user) => this.updateStoredUser(user)),
      map((user) => user as User | null),
      catchError(() => of(this.currentUser())),
    );
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  currentUser(): User | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw).user as User;
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw).access_token as string;
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw).refresh_token as string;
    } catch {
      return null;
    }
  }

  clearSession(): void {
    this.clearAuth();
  }

  private storeAuth(response: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(response));
  }

  private updateStoredUser(user: User): void {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AuthResponse;
      parsed.user = user;
      localStorage.setItem(this.storageKey, JSON.stringify(parsed));
    } catch {
      // If storage is malformed, keep existing behavior and avoid crashing app startup.
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(this.storageKey);
  }
}
