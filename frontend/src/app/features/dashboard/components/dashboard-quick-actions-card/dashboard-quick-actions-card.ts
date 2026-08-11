import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-quick-actions-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card">
      <div class="card-head">
        <h3>Quick actions</h3>
      </div>
      <div class="quick-links">
        <a routerLink="/projects">Create or manage projects</a>
        <a [routerLink]="boardRoute">Open board</a>
        <a routerLink="/notifications">View notifications</a>
        <a [routerLink]="sprintRoute">Open sprint workspace</a>
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

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      h3 {
        margin: 0;
        font-size: 1rem;
      }

      .quick-links {
        margin-top: 14px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .quick-links a {
        background: #f7fafc;
        border: 1px solid #dbe5f1;
        border-radius: 12px;
        padding: 12px;
        text-decoration: none;
        color: #0f172a;
        font-size: 0.88rem;
        font-weight: 600;
      }

      @media (max-width: 760px) {
        .quick-links {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardQuickActionsCardComponent {
  @Input({ required: true }) boardRoute: string | readonly (string | number)[] = '/projects';
  @Input({ required: true }) sprintRoute: string | readonly (string | number)[] = '/projects';
}
