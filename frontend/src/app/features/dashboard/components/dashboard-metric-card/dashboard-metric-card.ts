import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-metric-card',
  standalone: true,
  template: `
    <article class="card metric-card" [class]="'metric-card tone-' + tone">
      <div class="metric-top"><span class="metric-icon">{{ icon }}</span><span class="metric-label">{{ label }}</span></div>
      <strong>{{ value }}</strong>
      <small><i></i>{{ hint }}</small>
    </article>
  `,
  styles: [
    `
      .metric-card {
        --tone: #6366f1;
        --tone-soft: #eef2ff;
        position: relative;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.86);
        border: 1px solid rgba(226, 232, 240, 0.92);
        border-radius: 18px;
        padding: 17px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 126px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.045);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .metric-card::after { content: ''; position: absolute; width: 90px; height: 90px; right: -36px; top: -42px; border-radius: 50%; background: var(--tone-soft); }
      .metric-card:hover { transform: translateY(-3px); box-shadow: 0 16px 30px rgba(15, 23, 42, 0.1); }
      .metric-top { display: flex; align-items: center; gap: 8px; position: relative; z-index: 1; }
      .metric-icon { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 8px; background: var(--tone-soft); color: var(--tone); font-size: .95rem; }
      .metric-label {
        font-size: 0.8rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 750;
      }
      strong {
        margin-top: 12px;
        font-size: 2rem;
        line-height: 1;
        letter-spacing: -0.05em;
      }
      small {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 11px;
        color: #64748b;
        font-size: .76rem;
      }
      small i { width: 5px; height: 5px; border-radius: 50%; background: var(--tone); }
      .tone-indigo { --tone: #6366f1; --tone-soft: #eef2ff; }.tone-sky { --tone: #0284c7; --tone-soft: #e0f2fe; }.tone-violet { --tone: #7c3aed; --tone-soft: #f3e8ff; }.tone-emerald { --tone: #059669; --tone-soft: #d1fae5; }.tone-rose { --tone: #e11d48; --tone-soft: #ffe4e6; }
    `,
  ],
})
export class DashboardMetricCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: number | string = 0;
  @Input({ required: true }) hint = '';
  @Input() icon = '•';
  @Input() tone: 'indigo' | 'sky' | 'violet' | 'emerald' | 'rose' = 'indigo';
}
