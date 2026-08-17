import { Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { SearchService } from '../../../core/services/search.service';
import { SearchResult, SearchResultType } from '../../../core/models/search.model';
import { NotificationsService } from '../../../features/notifications/services/notifications.service';
import { Notification } from '../../../core/models/app-models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);
  protected readonly notifications = inject(NotificationsService);

  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  protected readonly userName = signal('Loading...');
  protected readonly userEmail = signal('member@smarttask.app');
  protected readonly profileMenuOpen = signal(false);
  protected readonly notificationMenuOpen = signal(false);
  protected readonly sidebarOpen = signal(false);

  protected readonly searchOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly searchLoading = signal(false);
  protected readonly searchResults = signal<SearchResult[]>([]);
  protected readonly searchActiveIndex = signal(0);
  protected readonly searchHasSearched = signal(false);

  protected readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', exact: true },
    { label: 'Organizations', route: '/organizations', icon: 'organizations', exact: true },
    { label: 'Projects', route: '/projects', icon: 'projects', exact: true },
    { label: 'Notifications', route: '/notifications', icon: 'notifications', exact: true },
    { label: 'Settings', route: '/settings', icon: 'settings', exact: false },
  ] as const;

  constructor() {
    const user = this.authService.currentUser();
    this.userName.set(user?.username ?? 'Guest');
    this.userEmail.set(user?.email ?? 'member@smarttask.app');

    this.authService.syncCurrentUser().subscribe((freshUser) => {
      if (freshUser?.username) this.userName.set(freshUser.username);
      if (freshUser?.email) this.userEmail.set(freshUser.email);
    });

    this.notifications.start();

    this.searchInput$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((query) => {
          const normalized = query.trim();
          if (normalized.length < 2) {
            this.searchLoading.set(false);
            this.searchResults.set([]);
            this.searchHasSearched.set(false);
            return of(null);
          }

          this.searchLoading.set(true);
          this.searchHasSearched.set(true);
          return this.searchService
            .search(normalized, 8)
            .pipe(catchError(() => of({ query: normalized, results: [], total: 0 })));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        this.searchLoading.set(false);
        if (!response) return;
        this.searchResults.set(response.results);
        this.searchActiveIndex.set(0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notifications.stop();
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';

    if (isShortcut) {
      event.preventDefault();
      this.openSearch();
      return;
    }

    if (!this.searchOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSearch();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveSearchSelection(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveSearchSelection(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.openActiveSearchResult();
    }
  }

  openSearch(): void {
    this.profileMenuOpen.set(false);
    this.notificationMenuOpen.set(false);
    this.searchOpen.set(true);
    this.searchActiveIndex.set(0);
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('.global-search-input')?.focus();
    });
  }

  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchHasSearched.set(false);
    this.searchLoading.set(false);
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.searchInput$.next(value);
  }

  moveSearchSelection(delta: number): void {
    const count = this.searchResults().length;
    if (!count) return;
    const next = (this.searchActiveIndex() + delta + count) % count;
    this.searchActiveIndex.set(next);
  }

  setSearchActiveIndex(index: number): void {
    this.searchActiveIndex.set(index);
  }

  openSearchResult(result?: SearchResult): void {
    const target = result ?? this.searchResults()[this.searchActiveIndex()];
    if (!target) return;
    this.closeSearch();
    this.router.navigateByUrl(target.url);
  }

  openActiveSearchResult(): void {
    this.openSearchResult();
  }

  searchIcon(type: SearchResultType): string {
    switch (type) {
      case 'person':
        return 'bi-person';
      case 'project':
        return 'bi-folder2-open';
      case 'task':
        return 'bi-check2-square';
      default:
        return 'bi-search';
    }
  }

  searchTypeLabel(type: SearchResultType): string {
    switch (type) {
      case 'person':
        return 'People';
      case 'project':
        return 'Projects';
      case 'task':
        return 'Tasks';
      default:
        return 'Results';
    }
  }

  searchGroups(): SearchResult[][] {
    const results = this.searchResults();
    return [
      results.filter((result) => result.type === 'person'),
      results.filter((result) => result.type === 'project'),
      results.filter((result) => result.type === 'task'),
    ].filter((group) => group.length > 0);
  }

  toggleProfileMenu(): void {
    this.searchOpen.set(false);
    this.notificationMenuOpen.set(false);
    this.profileMenuOpen.update((value) => !value);
  }

  toggleNotificationMenu(): void {
    this.searchOpen.set(false);
    this.profileMenuOpen.set(false);
    this.notificationMenuOpen.update((value) => !value);
    if (this.notificationMenuOpen()) this.notifications.refresh();
  }

  closeNotificationMenu(): void {
    this.notificationMenuOpen.set(false);
  }

  openNotification(item: Notification): void {
    this.notifications.markRead(item.id).subscribe({
      next: () => this.notifications.markReadLocal(item.id),
      error: () => undefined,
    });
    this.closeNotificationMenu();
    this.router.navigate(['/notifications']);
  }

  markAllNotificationsRead(): void {
    this.notifications.markAllRead().subscribe({
      next: () => this.notifications.markAllReadLocal(),
      error: () => undefined,
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onNavigate(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 980) this.closeSidebar();
  }

  closeProfileMenu(): void {
    this.profileMenuOpen.set(false);
  }

  avatarSeed(): string {
    return encodeURIComponent(this.userName().trim() || 'user');
  }

  logout(): void {
    this.closeProfileMenu();
    this.notifications.stop();
    this.authService.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
