import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-work-snapshot-card',
  standalone: true,
  template: `
    <article class="card">
      <h3>Work snapshot</h3>
      <div class="snapshot-grid">
        <div>
          <span>To do</span>
          <strong>{{ todoCount }}</strong>
        </div>
        <div>
          <span>In progress</span>
          <strong>{{ inProgressCount }}</strong>
        </div>
        <div>
          <span>Done</span>
          <strong>{{ doneCount }}</strong>
        </div>
      </div>
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

      h3 {
        margin: 0 0 12px;
        font-size: 1rem;
      }

      .snapshot-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .snapshot-grid div {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px;
      }

      span {
        display: block;
        font-size: 0.78rem;
        color: #64748b;
      }

      strong {
        margin-top: 8px;
        display: block;
        font-size: 1.1rem;
      }

      @media (max-width: 760px) {
        .snapshot-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardWorkSnapshotCardComponent {
  @Input({ required: true }) todoCount = 0;
  @Input({ required: true }) inProgressCount = 0;
  @Input({ required: true }) doneCount = 0;
}
