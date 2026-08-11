import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-card">
      <h2>Notifications</h2>
      <div class="list">
        <div class="item" *ngFor="let item of items">
          <strong>{{ item.title }}</strong>
          <p>{{ item.detail }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-card {
        background: rgba(15, 23, 42, 0.82);
        padding: 20px;
        border-radius: 18px;
      }
    `,
    `
      .list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 12px;
      }
    `,
    `
      .item {
        background: rgba(255, 255, 255, 0.06);
        padding: 12px;
        border-radius: 12px;
      }
    `,
  ],
})
export class NotificationsPage {
  protected items = [
    { title: 'Task updated', detail: 'The onboarding checklist received a new comment.' },
    { title: 'Sprint started', detail: 'Sprint 3 is now active and ready for work.' },
    { title: 'Comment added', detail: 'A new insight was added to the design review.' },
  ];
}
