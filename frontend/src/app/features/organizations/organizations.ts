import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Member, Organization, OrganizationRole } from '../../core/models/app-models';

import { OrganizationService } from '../../core/services/organization.service';

import { OrganizationHeaderComponent } from './components/organization-header/organization-header.component';

import { OrganizationSummaryComponent } from './components/organization-summary/organization-summary.component';

import { OrganizationTableComponent } from './components/organization-table/organization-table.component';

import {
  OrganizationFormComponent,
  OrganizationFormValue,
} from './components/organization-form/organization-form.component';

import { OrganizationMembersComponent } from './components/organization-members/organization-members.component';

type OrganizationStatus = 'active' | 'inactive';

@Component({
  selector: 'app-organizations',

  standalone: true,

  imports: [
    CommonModule,

    OrganizationHeaderComponent,
    OrganizationSummaryComponent,
    OrganizationTableComponent,
    OrganizationFormComponent,
    OrganizationMembersComponent,
  ],

  templateUrl: './organizations.html',

  styleUrl: './organizations.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationsPage implements OnInit {
  private readonly service = inject(OrganizationService);

  protected readonly organizations = signal<Organization[]>([]);

  protected readonly selected = signal<Organization | null>(null);

  protected readonly members = signal<Member[]>([]);

  protected readonly editing = signal<OrganizationFormValue | null>(null);

  protected readonly loading = signal(false);

  protected readonly membersLoading = signal(false);

  protected readonly saving = signal(false);

  protected readonly inviting = signal(false);

  protected readonly updatingMemberId = signal<string | null>(null);

  protected readonly errorMessage = signal('');

  protected readonly successMessage = signal('');

  protected searchTerm = '';

  protected statusFilter: 'all' | 'active' | 'inactive' = 'all';

  protected inviteUserId = '';

  protected inviteRole: OrganizationRole = 'member';

  ngOnInit(): void {
    this.load();
  }

  /**
   * Load organizations.
   */
  protected load(): void {
    this.loading.set(true);

    this.errorMessage.set('');

    this.service.list().subscribe({
      next: (items) => {
        this.organizations.set(items);

        this.loading.set(false);

        const current = this.selected();

        if (!current) {
          return;
        }

        const refreshed = items.find((item) => item.id === current.id);

        if (refreshed) {
          this.selected.set(refreshed);
        }
      },

      error: (error) => {
        console.error('Failed to load organizations', error);

        this.loading.set(false);

        this.errorMessage.set(
          this.service.getErrorMessage(error, 'Unable to load organizations. Please try again.'),
        );
      },
    });
  }

  /**
   * Select organization and load members.
   */
  protected select(organization: Organization): void {
    this.selected.set(organization);

    this.members.set([]);

    this.membersLoading.set(true);

    this.errorMessage.set('');

    this.service.members(organization.id).subscribe({
      next: (members) => {
        this.members.set(members);

        this.membersLoading.set(false);
      },

      error: (error) => {
        console.error('Failed to load organization members', error);

        this.membersLoading.set(false);

        this.errorMessage.set(
          this.service.getErrorMessage(error, 'Unable to load organization members.'),
        );
      },
    });
  }

  /**
   * Open create form.
   */
  protected openCreateForm(): void {
    this.clearMessages();

    this.editing.set({
      name: '',
      slug: '',
      description: '',
    });
  }

  /**
   * Open edit form.
   */
  protected beginEdit(organization: Organization): void {
    this.clearMessages();

    this.editing.set({
      id: organization.id,

      name: organization.name,

      slug: organization.slug,

      description: organization.description ?? '',
    });
  }

  /**
   * Close form.
   */
  protected closeForm(): void {
    if (this.saving()) {
      return;
    }

    this.editing.set(null);
  }

  /**
   * Create/update organization.
   */
  protected save(form: OrganizationFormValue): void {
    const name = form.name.trim();

    if (!name) {
      this.errorMessage.set('Organization name is required.');

      return;
    }

    const slug = form.slug.trim() || this.generateSlug(name);

    if (!slug) {
      this.errorMessage.set('A valid organization slug is required.');

      return;
    }

    this.saving.set(true);

    this.errorMessage.set('');

    const description = form.description.trim();

    const request = form.id
      ? this.service.update(form.id, {
          name,
          description,
        })
      : this.service.create({
          name,
          slug,
          description,
        });

    request.subscribe({
      next: (saved) => {
        this.saving.set(false);

        this.editing.set(null);

        this.successMessage.set(
          form.id ? 'Organization updated successfully.' : 'Organization created successfully.',
        );

        this.load();

        this.select(saved);

        this.clearSuccessAfterDelay();
      },

      error: (error) => {
        console.error('Failed to save organization', error);

        this.saving.set(false);

        this.errorMessage.set(
          this.service.getErrorMessage(error, 'Unable to save the organization.'),
        );
      },
    });
  }

  /**
   * Add member.
   */
  protected invite(): void {
    const organization = this.selected();

    const userId = this.inviteUserId.trim();

    if (!organization || !userId) {
      return;
    }

    this.inviting.set(true);

    this.errorMessage.set('');

    this.service.invite(organization.id, userId, this.inviteRole).subscribe({
      next: () => {
        this.inviting.set(false);

        this.inviteUserId = '';

        this.inviteRole = 'member';

        this.successMessage.set('Member added successfully.');

        this.select(organization);

        this.clearSuccessAfterDelay();
      },

      error: (error) => {
        console.error('Failed to add member', error);

        this.inviting.set(false);

        this.errorMessage.set(this.service.getErrorMessage(error, 'Unable to add this user.'));
      },
    });
  }

  /**
   * Change member role.
   */
  protected changeRole(member: Member, role: OrganizationRole): void {
    const organization = this.selected();

    if (!organization || member.role === role) {
      return;
    }

    /**
     * Backend does not allow owner role
     * to be changed.
     */
    if (member.role === 'owner') {
      return;
    }

    this.updatingMemberId.set(member.user_id);

    this.errorMessage.set('');

    this.service.updateRole(organization.id, member.user_id, role).subscribe({
      next: () => {
        this.updatingMemberId.set(null);

        this.successMessage.set('Member role updated successfully.');

        this.select(organization);

        this.clearSuccessAfterDelay();
      },

      error: (error) => {
        console.error('Failed to update member role', error);

        this.updatingMemberId.set(null);

        this.errorMessage.set(
          this.service.getErrorMessage(error, 'Unable to update the member role.'),
        );
      },
    });
  }

  /**
   * Filter organizations.
   */
  protected filteredOrganizations(): Organization[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.organizations().filter((organization) => {
      const name = organization.name.toLowerCase();

      const slug = organization.slug.toLowerCase();

      const description = (organization.description ?? '').toLowerCase();

      const matchesSearch =
        !search || name.includes(search) || slug.includes(search) || description.includes(search);

      const matchesStatus =
        this.statusFilter === 'all' ||
        this.getOrganizationStatus(organization) === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  /**
   * Total active organizations.
   */
  protected activeOrganizationCount(): number {
    return this.organizations().filter((organization) => organization.is_active).length;
  }

  /**
   * Selected organization's administrators.
   */
  protected adminCount(): number {
    return this.members().filter((member) => member.role === 'admin').length;
  }

  /**
   * Get member count for selected organization.
   */
  protected getMemberCount(organizationId: string): number {
    const selected = this.selected();

    if (selected?.id === organizationId) {
      return this.members().length;
    }

    /**
     * Current GET /organizations only returns
     * organization information and does not contain
     * member_count.
     *
     * Therefore unknown organizations show 0 until
     * selected.
     */
    return 0;
  }

  /**
   * Organization status.
   */
  protected getOrganizationStatus(organization: Organization): OrganizationStatus {
    return organization.is_active ? 'active' : 'inactive';
  }

  /**
   * Format created date.
   */
  protected getCreatedDate(organization: Organization): string {
    if (!organization.created_at) {
      return '—';
    }

    const date = new Date(organization.created_at);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Search handler.
   */
  protected setSearchTerm(value: string): void {
    this.searchTerm = value;
  }

  /**
   * Status handler.
   */
  protected setStatusFilter(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = value;
  }

  /**
   * Generate slug from organization name.
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Clear alerts.
   */
  private clearMessages(): void {
    this.errorMessage.set('');

    this.successMessage.set('');
  }

  /**
   * Clear success message.
   */
  private clearSuccessAfterDelay(): void {
    setTimeout(() => {
      this.successMessage.set('');
    }, 4000);
  }
}
