import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="page-card">
      <h2>Settings</h2>
      <p>Theme, notification preferences, and workspace defaults will live here.</p>

      <a routerLink="/settings/change-password" class="action-link">Change password</a>

      <section class="admin-section">
        <h3>Admin controls</h3>

        @if (checkingAdmin()) {
          <p>Checking admin access…</p>
        } @else if (isAdmin()) {
          <form class="admin-form" [formGroup]="adminForm" (ngSubmit)="submitActivation()">
            <label for="target-email">Target user email</label>
            <input
              id="target-email"
              type="email"
              formControlName="target_email"
              placeholder="user@example.com"
            />

            <label for="account-status">Account status</label>
            <select id="account-status" formControlName="is_active">
              <option [ngValue]="true">Active</option>
              <option [ngValue]="false">Inactive</option>
            </select>

            <button type="submit" class="primary-button">Update account</button>
          </form>

          @if (adminActionMessage()) {
            <p class="admin-message">{{ adminActionMessage() }}</p>
          }
        } @else {
          <p class="admin-note">Admin-only tools are not available for this account.</p>
        }
      </section>
    </div>
  `,
  styles: [
    `
      .page-card {
        background: rgba(15, 23, 42, 0.82);
        padding: 20px;
        border-radius: 18px;
      }

      .action-link {
        display: inline-block;
        margin-top: 12px;
        color: #7dd3fc;
      }

      .admin-section {
        margin-top: 24px;
        border-top: 1px solid rgba(148, 163, 184, 0.25);
        padding-top: 18px;
      }

      .admin-form {
        display: grid;
        gap: 10px;
        margin-top: 10px;
        max-width: 460px;
      }

      .admin-form input,
      .admin-form select {
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.4);
        background: rgba(15, 23, 42, 0.7);
        color: #e2e8f0;
        padding: 10px 12px;
      }

      .primary-button {
        margin-top: 4px;
        border: 0;
        border-radius: 8px;
        padding: 10px 12px;
        color: #082f49;
        background: #7dd3fc;
        font-weight: 600;
        cursor: pointer;
      }

      .admin-message {
        margin-top: 10px;
        color: #86efac;
      }

      .admin-note {
        margin-top: 10px;
        color: #cbd5e1;
      }
    `,
  ],
})
export class SettingsPage {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly checkingAdmin = signal(true);
  protected readonly isAdmin = signal(false);
  protected readonly adminActionMessage = signal('');

  protected readonly adminForm = this.fb.nonNullable.group({
    target_email: ['', [Validators.required, Validators.email]],
    is_active: [true],
  });

  constructor() {
    this.authService.adminCheck().subscribe({
      next: () => {
        this.isAdmin.set(true);
        this.checkingAdmin.set(false);
      },
      error: () => {
        this.isAdmin.set(false);
        this.checkingAdmin.set(false);
      },
    });
  }

  submitActivation(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    const values = this.adminForm.getRawValue();

    this.authService.activateAccount(values.target_email, values.is_active).subscribe((user) => {
      const statusText = user.is_active ? 'active' : 'inactive';
      this.adminActionMessage.set(`Updated ${user.email} to ${statusText}.`);
    });
  }
}
