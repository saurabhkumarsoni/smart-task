import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly userName = signal('Loading...');
  protected readonly userEmail = signal('member@smarttask.app');
  protected readonly profileMenuOpen = signal(false);
  protected readonly sidebarOpen = signal(false);

  protected readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', exact: true },
    { label: 'Organizations', route: '/organizations', icon: 'organizations', exact: true },
    { label: 'Projects', route: '/projects', icon: 'projects', exact: true },
    { label: 'Board', route: '/projects/demo-board/board', icon: 'board', exact: true },
    { label: 'Sprints', route: '/projects/demo-board', icon: 'sprints', exact: true },
    { label: 'Notifications', route: '/notifications', icon: 'notifications', exact: true },
    { label: 'Settings', route: '/settings', icon: 'settings', exact: false },
  ] as const;

  constructor() {
    const user = this.authService.currentUser();
    this.userName.set(user?.username ?? 'Guest');
    this.userEmail.set(user?.email ?? 'member@smarttask.app');

    this.authService.syncCurrentUser().subscribe((freshUser) => {
      if (freshUser?.username) {
        this.userName.set(freshUser.username);
      }

      if (freshUser?.email) {
        this.userEmail.set(freshUser.email);
      }
    });
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((value) => !value);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onNavigate(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 980) {
      this.closeSidebar();
    }
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  avatarSeed(): string {
    const user = this.userName().trim() || 'user';
    return encodeURIComponent(user);
  }

  logout(): void {
    this.closeProfileMenu();
    this.authService.logout().subscribe(() => {
      this.router.navigateByUrl('/login');
    });
  }
}
