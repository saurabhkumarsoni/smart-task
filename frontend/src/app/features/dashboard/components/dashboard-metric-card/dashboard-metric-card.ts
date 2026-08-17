import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-metric-card',
  standalone: true,
  template: `
    <article class="metric-card" [class]="'metric-card tone-' + tone">
      <div class="metric-glow"></div>
      <div class="metric-top">
        <span class="metric-icon"><i [class]="'bi bi-' + icon" aria-hidden="true"></i></span>
        <span class="metric-label">{{ label }}</span>
      </div>
      <strong>{{ value }}</strong>
      <small><i></i>{{ hint }}</small>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      .metric-card {
        --tone: #6366f1;
        --tone-soft: #eef2ff;
        position: relative;
        overflow: hidden;
        min-height: 142px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border: 1px solid rgba(226, 232, 240, 0.95);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 10px 26px rgba(15, 23, 42, 0.055);
        transition:
          transform 0.22s ease,
          box-shadow 0.22s ease,
          border-color 0.22s ease;
      }
      .metric-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.1);
        border-color: color-mix(in srgb, var(--tone) 25%, #e2e8f0);
      }
      .metric-glow {
        position: absolute;
        width: 120px;
        height: 120px;
        right: -52px;
        top: -52px;
        border-radius: 50%;
        background: var(--tone-soft);
        opacity: 0.9;
      }
      .metric-top {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .metric-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 11px;
        color: var(--tone);
        background: var(--tone-soft);
        font-size: 1rem;
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tone) 10%, transparent);
      }
      .metric-label {
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      strong {
        position: relative;
        z-index: 1;
        margin-top: 14px;
        color: #0f172a;
        font-size: 2.25rem;
        line-height: 1;
        letter-spacing: -0.06em;
      }
      small {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 7px;
        color: #64748b;
        font-size: 0.76rem;
      }
      small i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--tone);
        box-shadow: 0 0 0 4px var(--tone-soft);
      }
      .tone-indigo {
        --tone: #4f46e5;
        --tone-soft: #eef2ff;
      }
      .tone-sky {
        --tone: #0284c7;
        --tone-soft: #e0f2fe;
      }
      .tone-violet {
        --tone: #7c3aed;
        --tone-soft: #f3e8ff;
      }
      .tone-emerald {
        --tone: #059669;
        --tone-soft: #d1fae5;
      }
      .tone-rose {
        --tone: #e11d48;
        --tone-soft: #ffe4e6;
      }
    `,
  ],
})
export class DashboardMetricCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: number | string = 0;
  @Input({ required: true }) hint = '';
  @Input() icon = 'circle';
  @Input() tone: 'indigo' | 'sky' | 'violet' | 'emerald' | 'rose' = 'indigo';
}
