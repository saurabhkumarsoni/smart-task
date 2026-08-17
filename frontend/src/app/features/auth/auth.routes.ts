import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterPage } from './register/register';
import { ForgotPasswordPage } from './forgot-password/forgot-password';
import { ResetPasswordPage } from './reset-password/reset-password';
import { VerifyEmailPage } from './verify-email/verify-email';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage },
  { path: 'verify-email', component: VerifyEmailPage },
  { path: 'change-password', component: ChangePasswordComponent },
];
