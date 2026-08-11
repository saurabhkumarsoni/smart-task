import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  template: `
    <section class="confirm-dialog">
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <div class="actions">
        <button type="button" (click)="cancel.emit()">Cancel</button>
        <button type="button" class="danger" (click)="confirm.emit()">{{ confirmLabel }}</button>
      </div>
    </section>
  `,
  styles: [
    `
      .confirm-dialog {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
      }

      h3 {
        margin: 0;
      }

      p {
        color: #64748b;
      }

      .actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .danger {
        background: #b91c1c;
        color: #fff;
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  @Input() title = 'Please confirm';
  @Input() message = 'Are you sure you want to continue?';
  @Input() confirmLabel = 'Confirm';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
