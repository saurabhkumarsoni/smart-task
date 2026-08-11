import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-priority-chip',
  standalone: true,
  template: `
    <span class="chip" [class.high]="priority === 'HIGH'" [class.medium]="priority === 'MEDIUM'">{{
      priority
    }}</span>
  `,
  styles: [
    `
      .chip {
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 0.74rem;
        border: 1px solid #cbd5e1;
      }

      .high {
        background: #fee2e2;
        border-color: #fca5a5;
      }

      .medium {
        background: #fef3c7;
        border-color: #fcd34d;
      }
    `,
  ],
})
export class PriorityChipComponent {
  @Input() priority = 'LOW';
}
