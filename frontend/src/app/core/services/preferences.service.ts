import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserPreferences, UserPreferenceKey } from '../models/user-preference.model';

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'user_id' | 'updated_at'> = {
  email_notifications: true,
  desktop_notifications: true,
  task_assignments: true,
  mentions: true,
  weekly_digest: false,
  compact_mode: false,
};

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/auth/me/preferences`;
  private readonly storageKey = 'smart-task-preferences-cache';

  get(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.url).pipe(
      tap((value) => this.cache(value)),
      catchError(() => of(this.cached())),
    );
  }

  update(patch: Partial<Record<UserPreferenceKey, boolean>>): Observable<UserPreferences> {
    return this.http
      .patch<UserPreferences>(this.url, patch)
      .pipe(tap((value) => this.cache(value)));
  }

  defaults(userId = ''): UserPreferences {
    return { ...DEFAULT_PREFERENCES, user_id: userId, updated_at: new Date().toISOString() };
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  private cache(value: UserPreferences): void {
    localStorage.setItem(this.storageKey, JSON.stringify(value));
  }

  private cached(): UserPreferences {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? { ...this.defaults(), ...JSON.parse(raw) } : this.defaults();
    } catch {
      return this.defaults();
    }
  }
}
