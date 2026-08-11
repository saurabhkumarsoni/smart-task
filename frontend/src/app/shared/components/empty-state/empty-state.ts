import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="empty-state">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      @if (actionLabel && actionRoute) {
        <a [routerLink]="actionRoute">{{ actionLabel }}</a>
      }
    </section>
  `,
  styles: [
    `
      .empty-state {
        border: 1px dashed #cbd5e1;
        border-radius: 14px;
        padding: 20px;
      }

      h3 {
        margin: 0;
      }

      p {
        margin: 8px 0 0;
        color: #64748b;
      }

      a {
        margin-top: 12px;
        display: inline-block;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) message = '';
  @Input() actionLabel = '';
  @Input() actionRoute: string | readonly (string | number)[] | null = null;
}
