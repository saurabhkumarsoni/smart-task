import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Organization } from '../../core/models/app-models';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-card">
      <div class="page-title">
        <h2>Organizations</h2>
        <button type="button">Create organization</button>
      </div>
      <div class="org-grid">
        <div class="card" *ngFor="let organization of organizations">
          <h3>{{ organization.name }}</h3>
          <p>{{ organization.description }}</p>
          <span>{{ organization.members }} members</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-card {
        background: rgba(15, 23, 42, 0.82);
        padding: 20px;
        border-radius: 18px;
      }
    `,
    `
      .page-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
    `,
    `
      .org-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
    `,
    `
      .card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 16px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.06);
      }
    `,
    `
      button {
        border: 0;
        background: #7c3aed;
        color: white;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
      }
    `,
  ],
})
export class OrganizationsPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected organizations: Organization[] = [];

  ngOnInit(): void {
    this.http
      .get<Organization[]>(`${environment.apiBaseUrl}/organizations`)
      .subscribe((organizations) => {
        this.organizations = organizations;
      });
  }
}
