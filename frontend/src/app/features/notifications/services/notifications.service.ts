import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, catchError, interval, of, startWith } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { Notification } from '../../../core/models/app-models';

export interface NotificationSummary {
  unread_count: number;
  total_count: number;
  digest: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiBase = environment.apiBaseUrl;

  readonly items = signal<Notification[]>([]);
  readonly unreadCount = signal(0);
  readonly connected = signal(false);
  readonly loading = signal(false);

  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private pollingSubscription: Subscription | null = null;
  private started = false;

  start(): void {
    if (this.started || !this.auth.isAuthenticated()) return;
    this.started = true;
    this.refresh();
    this.connect();

    // REST polling is a resilience fallback for deployments where WebSockets are
    // disabled by a reverse proxy or when the browser temporarily loses the socket.
    this.pollingSubscription = interval(60_000)
      .pipe(startWith(0))
      .subscribe(() => this.refreshSummary());
  }

  stop(): void {
    this.started = false;
    this.connected.set(false);
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
  }

  refresh(): void {
    if (!this.auth.isAuthenticated()) return;
    this.loading.set(true);
    this.http.get<Notification[]>(`${this.apiBase}/notifications`).subscribe({
      next: (items) => {
        this.items.set(this.sort(items));
        this.updateUnreadCount();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.refreshSummary();
  }

  refreshSummary(): void {
    if (!this.auth.isAuthenticated()) return;
    this.http
      .get<NotificationSummary>(`${this.apiBase}/notifications/summary`)
      .pipe(catchError(() => of(null)))
      .subscribe((summary) => {
        if (summary) this.unreadCount.set(summary.unread_count);
      });
  }

  markRead(id: string): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiBase}/notifications/${id}/read`, {}).pipe(
      // Optimistic UI is applied immediately; the server response reconciles the record.
      catchError((error) => {
        this.refresh();
        throw error;
      }),
    );
  }

  markReadLocal(id: string): void {
    this.items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
    );
    this.updateUnreadCount();
  }

  markAllRead(): Observable<{ updated_count: number }> {
    return this.http.post<{ updated_count: number }>(`${this.apiBase}/notifications/read-all`, {});
  }

  markAllReadLocal(): void {
    this.items.update((items) => items.map((item) => ({ ...item, is_read: true })));
    this.unreadCount.set(0);
  }

  private connect(): void {
    const token = this.auth.getAccessToken();
    if (!token || !this.started) return;

    const wsBase = this.apiBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    const url = `${wsBase}/notifications/ws?token=${encodeURIComponent(token)}`;

    try {
      this.socket = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.connected.set(true);
      this.reconnectAttempt = 0;
    };

    this.socket.onmessage = (event) => this.handleMessage(event.data);

    this.socket.onerror = () => {
      this.connected.set(false);
    };

    this.socket.onclose = () => {
      this.connected.set(false);
      this.socket = null;
      this.scheduleReconnect();
    };
  }

  private handleMessage(raw: string): void {
    try {
      const event = JSON.parse(raw) as {
        type?: string;
        notification?: Notification;
      };

      if (event.type === 'notification.created' && event.notification) {
        this.items.update((items) => {
          const withoutDuplicate = items.filter((item) => item.id !== event.notification!.id);
          return this.sort([event.notification!, ...withoutDuplicate]);
        });
        this.unreadCount.update((count) => count + (event.notification!.is_read ? 0 : 1));
      }
    } catch {
      // Ignore malformed events; REST remains the source of truth.
    }
  }

  private scheduleReconnect(): void {
    if (!this.started || this.reconnectTimer) return;
    const delay = Math.min(30_000, 1_000 * 2 ** this.reconnectAttempt++);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private updateUnreadCount(): void {
    this.unreadCount.set(this.items().filter((item) => !item.is_read).length);
  }

  private sort(items: Notification[]): Notification[] {
    return [...items].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }
}
