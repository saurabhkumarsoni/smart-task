import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-state-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <article
      class="state-card"
      [class.state-error]="variant === 'error'"
      [class.state-empty]="variant === 'empty'"
    >
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>

      @if (actionLabel) {
        @if (actionRoute && !actionIsButton) {
          <a [routerLink]="actionRoute" class="action-link">{{ actionLabel }}</a>
        } @else {
          <button type="button" (click)="action.emit()">{{ actionLabel }}</button>
        }
      }
    </article>
  `,
  styles: [
    `
      .state-card {
        background: #ffffff;
        border: 1px solid #dbe5f1;
        border-radius: 16px;
        padding: 24px;
      }

      h2 {
        margin: 0;
        font-size: 1.16rem;
      }

      p {
        margin: 10px 0 0;
        color: #475569;
        font-size: 0.92rem;
      }

      .action-link,
      button {
        margin-top: 14px;
        display: inline-block;
        border-radius: 10px;
        text-decoration: none;
        padding: 10px 14px;
        font-size: 0.88rem;
        font-weight: 600;
      }

      .action-link {
        background: #f8fafc;
        border: 1px solid #dbe5f1;
        color: #0f172a;
      }

      button {
        border: 0;
        background: #0f172a;
        color: #ffffff;
        cursor: pointer;
      }

      .state-error {
        border-color: #fecaca;
      }
    `,
  ],
})
export class DashboardStateCardComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) message = '';
  @Input() variant: 'default' | 'error' | 'empty' = 'default';
  @Input() actionLabel = '';
  @Input() actionRoute: string | readonly (string | number)[] | null = null;
  @Input() actionIsButton = false;

  @Output() action = new EventEmitter<void>();
}
