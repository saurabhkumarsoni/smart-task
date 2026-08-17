import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationsService } from './services/notifications.service';
import { Notification } from '../../core/models/app-models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="notification-page">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Activity center</span>
          <h2>Notifications</h2>
          <p>Keep track of task updates, reminders and team activity.</p>
        </div>
        <button class="mark-all" type="button" [disabled]="notifications.unreadCount() === 0" (click)="markAllRead()">
          <i class="bi bi-check2-all"></i> Mark all as read
        </button>
      </div>

      <div class="summary-strip">
        <div><strong>{{ notifications.unreadCount() }}</strong><span>Unread</span></div>
        <div><strong>{{ notifications.items().length }}</strong><span>Total</span></div>
        <div><span class="live-dot" [class.connected]="notifications.connected()"></span><strong>{{ notifications.connected() ? 'Live' : 'Offline' }}</strong><span>updates</span></div>
      </div>

      <div class="notification-card">
        @for (item of notifications.items(); track item.id) {
          <article class="notification-item" [class.unread]="!item.is_read">
            <div class="item-icon"><i class="bi bi-bell-fill"></i></div>
            <div class="item-content">
              <div class="item-title-row">
                <h3>{{ item.title }}</h3>
                @if (!item.is_read) { <span class="new-pill">New</span> }
              </div>
              <p>{{ item.message }}</p>
              <time>{{ item.created_at | date:'MMM d, yyyy · h:mm a' }}</time>
            </div>
            @if (!item.is_read) {
              <button class="read-button" type="button" (click)="markRead(item)">Mark read</button>
            }
          </article>
        } @empty {
          <div class="empty-state">
            <div class="empty-icon"><i class="bi bi-bell-slash"></i></div>
            <h3>No notifications yet</h3>
            <p>You're all caught up. New task activity will appear here in real time.</p>
            <a routerLink="/dashboard">Back to dashboard</a>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display:block; }
    .notification-page { max-width: 980px; margin: 0 auto; padding-bottom: 30px; }
    .page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:22px; }
    .eyebrow { color:#2563eb; text-transform:uppercase; letter-spacing:.12em; font-size:.68rem; font-weight:800; }
    h2 { margin:5px 0 4px; color:#0f172a; font-size:1.7rem; }
    .page-heading p { margin:0; color:#64748b; font-size:.82rem; }
    .mark-all { border:1px solid #dbe4ef; background:#fff; color:#2563eb; border-radius:10px; padding:10px 13px; font-weight:700; cursor:pointer; }
    .mark-all:disabled { color:#94a3b8; cursor:not-allowed; }
    .summary-strip { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
    .summary-strip > div { min-height:70px; display:flex; align-items:center; gap:8px; padding:14px 16px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; }
    .summary-strip strong { color:#0f172a; font-size:1.1rem; }
    .summary-strip span:not(.live-dot) { color:#64748b; font-size:.72rem; }
    .summary-strip > div:first-child { flex-wrap:wrap; }
    .notification-card { overflow:hidden; border:1px solid #e2e8f0; border-radius:16px; background:#fff; box-shadow:0 8px 28px rgba(15,23,42,.05); }
    .notification-item { display:grid; grid-template-columns:42px minmax(0,1fr) auto; gap:14px; padding:18px; border-bottom:1px solid #eef2f7; align-items:start; }
    .notification-item:last-child { border-bottom:0; }
    .notification-item.unread { background:#f8fbff; }
    .item-icon { width:42px; height:42px; border-radius:12px; display:grid; place-items:center; background:#eff6ff; color:#2563eb; }
    .item-content { min-width:0; }
    .item-title-row { display:flex; align-items:center; gap:8px; }
    h3 { margin:0; color:#0f172a; font-size:.88rem; }
    .new-pill { border-radius:999px; padding:3px 7px; background:#dbeafe; color:#1d4ed8; font-size:.62rem; font-weight:800; }
    .item-content p { margin:6px 0 7px; color:#64748b; line-height:1.5; font-size:.78rem; }
    time { color:#94a3b8; font-size:.68rem; }
    .read-button { border:0; background:transparent; color:#2563eb; font-size:.7rem; font-weight:750; cursor:pointer; padding:5px 0; white-space:nowrap; }
    .live-dot { width:8px; height:8px; border-radius:50%; background:#f59e0b; margin-left:4px; }
    .live-dot.connected { background:#22c55e; box-shadow:0 0 0 4px rgba(34,197,94,.1); }
    .empty-state { min-height:360px; display:grid; place-items:center; align-content:center; text-align:center; padding:30px; }
    .empty-icon { width:58px; height:58px; display:grid; place-items:center; border-radius:50%; background:#f1f5f9; color:#64748b; font-size:1.2rem; }
    .empty-state h3 { margin:15px 0 5px; font-size:1rem; }
    .empty-state p { max-width:400px; margin:0 0 14px; color:#94a3b8; font-size:.76rem; line-height:1.5; }
    .empty-state a { color:#2563eb; text-decoration:none; font-size:.76rem; font-weight:750; }
    @media (max-width:700px) { .page-heading { align-items:flex-start; flex-direction:column; } .summary-strip { grid-template-columns:1fr; } .notification-item { grid-template-columns:38px minmax(0,1fr); } .read-button { grid-column:2; justify-self:start; } .item-icon { width:38px; height:38px; } }
  `],
})
export class NotificationsPage implements OnInit {
  protected readonly notifications = inject(NotificationsService);

  ngOnInit(): void {
    this.notifications.start();
  }

  markRead(item: Notification): void {
    this.notifications.markRead(item.id).subscribe({
      next: () => this.notifications.markReadLocal(item.id),
    });
  }

  markAllRead(): void {
    this.notifications.markAllRead().subscribe({
      next: () => this.notifications.markAllReadLocal(),
    });
  }
}
