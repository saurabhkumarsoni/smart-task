import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <h2>{{ title }}</h2>
      @if (subtitle) {
        <p>{{ subtitle }}</p>
      }
    </header>
  `,
  styles: [
    `
      .page-header h2 {
        margin: 0;
        font-size: 1.4rem;
      }

      .page-header p {
        margin: 6px 0 0;
        color: #64748b;
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
