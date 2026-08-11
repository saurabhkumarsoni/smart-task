import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrap" role="status" [attr.aria-label]="label">
      <span class="spinner"></span>
      <small>{{ label }}</small>
    </div>
  `,
  styles: [
    `
      .spinner-wrap {
        display: inline-flex;
        align-items: center;
        gap: 10px;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid #cbd5e1;
        border-top-color: #0f172a;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  @Input() label = 'Loading...';
}
