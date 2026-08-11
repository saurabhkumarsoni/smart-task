import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../core/layouts/auth-layout/auth-layout';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, AuthLayoutComponent],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected status: 'idle' | 'success' | 'error' = 'idle';

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'error';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.status = 'success';
      },
      error: () => {
        this.status = 'error';
      },
    });
  }
}
