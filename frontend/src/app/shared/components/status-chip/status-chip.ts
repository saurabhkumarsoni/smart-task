import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `
    <span
      class="chip"
      [class.done]="status === 'DONE'"
      [class.progress]="status === 'IN_PROGRESS'"
      >{{ status }}</span
    >
  `,
  styles: [
    `
      .chip {
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 0.74rem;
        border: 1px solid #cbd5e1;
      }

      .done {
        background: #dcfce7;
        border-color: #86efac;
      }

      .progress {
        background: #e0e7ff;
        border-color: #a5b4fc;
      }
    `,
  ],
})
export class StatusChipComponent {
  @Input() status = 'TODO';
}
