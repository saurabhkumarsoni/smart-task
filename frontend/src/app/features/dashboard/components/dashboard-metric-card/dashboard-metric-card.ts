import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-metric-card',
  standalone: true,
  template: `
    <article class="card metric-card">
      <span>{{ label }}</span>
      <strong>{{ value }}</strong>
      <small>{{ hint }}</small>
    </article>
  `,
  styles: [
    `
      .card {
        background: #fff;
        border: 1px solid #dbe5f1;
        border-radius: 16px;
        padding: 16px;
      }

      .metric-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 132px;
      }

      span {
        font-size: 0.8rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      strong {
        margin-top: 8px;
        font-size: 1.9rem;
        line-height: 1;
      }

      small {
        margin-top: 10px;
        color: #64748b;
      }
    `,
  ],
})
export class DashboardMetricCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: number | string = 0;
  @Input({ required: true }) hint = '';
}
