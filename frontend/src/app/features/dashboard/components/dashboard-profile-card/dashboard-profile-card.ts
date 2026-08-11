import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-profile-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card profile-card">
      <img [src]="avatarUrl" alt="User profile" />
      <h2>{{ username }}</h2>
      <p>Workspace owner</p>
      <a routerLink="/settings" class="action-link">Manage profile</a>
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

      .profile-card {
        text-align: center;
      }

      img {
        width: 78px;
        height: 78px;
        border-radius: 50%;
      }

      h2 {
        margin: 14px 0 4px;
        font-size: 1.12rem;
      }

      p {
        margin: 0;
        color: #64748b;
      }

      .action-link {
        margin-top: 12px;
        display: inline-block;
        color: #0f172a;
        border: 1px solid #dbe5f1;
        border-radius: 999px;
        padding: 8px 12px;
        text-decoration: none;
        font-size: 0.85rem;
        font-weight: 600;
      }

      @media (max-width: 1180px) {
        .profile-card {
          text-align: left;
        }
      }
    `,
  ],
})
export class DashboardProfileCardComponent {
  @Input({ required: true }) username = '';
  @Input({ required: true }) avatarUrl = '';
}
