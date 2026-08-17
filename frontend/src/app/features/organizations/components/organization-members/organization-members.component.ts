import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Member, Organization, OrganizationRole } from '../../../../core/models/app-models';

@Component({
  selector: 'app-organization-members',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './organization-members.component.html',

  styleUrl: './organization-members.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationMembersComponent {
  @Input()
  organization: Organization | null = null;

  @Input()
  members: Member[] = [];

  @Input()
  loading = false;

  @Input()
  inviting = false;

  @Input()
  updatingMemberId: string | null = null;

  @Input()
  inviteUserId = '';

  @Input()
  inviteRole: OrganizationRole = 'member';

  @Output()
  inviteUserIdChange = new EventEmitter<string>();

  @Output()
  inviteRoleChange = new EventEmitter<OrganizationRole>();

  @Output()
  inviteMember = new EventEmitter<void>();

  @Output()
  roleChange = new EventEmitter<{
    member: Member;
    role: OrganizationRole;
  }>();

  @Output()
  editOrganization = new EventEmitter<Organization>();

  @Output()
  refresh = new EventEmitter<Organization>();

  /**
   * Returns the member display name.
   *
   * Current backend response:
   *
   * member.user.first_name
   * member.user.last_name
   * member.user.username
   * member.user.email
   */
  protected getMemberDisplayName(member: Member): string {
    const user = member.user;

    if (!user) {
      return this.formatUuid(member.user_id);
    }

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

    if (fullName) {
      return fullName;
    }

    if (user.username?.trim()) {
      return user.username.trim();
    }

    if (user.email?.trim()) {
      return user.email.trim();
    }

    return this.formatUuid(member.user_id);
  }

  /**
   * Returns member email.
   *
   * Current backend:
   *
   * member.user.email
   */
  protected getMemberEmail(member: Member): string {
    return member.user?.email?.trim() || 'Email unavailable';
  }

  /**
   * Returns username.
   */
  protected getMemberUsername(member: Member): string {
    return member.user?.username?.trim() || '';
  }

  /**
   * Returns initials for member avatar.
   */
  protected getInitials(member: Member): string {
    const name = this.getMemberDisplayName(member);

    if (!name) {
      return 'US';
    }

    /**
     * UUID fallback.
     */
    if (this.isUuid(name)) {
      return name.replaceAll('-', '').substring(0, 2).toUpperCase();
    }

    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  /**
   * Human readable role label.
   */
  protected getRoleLabel(role: OrganizationRole): string {
    switch (role) {
      case 'owner':
        return 'Owner';

      case 'admin':
        return 'Admin';

      case 'member':
        return 'Member';

      case 'viewer':
        return 'Viewer';

      default:
        return 'Unknown';
    }
  }

  /**
   * Access level based on role.
   */
  protected getAccessLabel(role: OrganizationRole): string {
    switch (role) {
      case 'owner':
        return 'Full control';

      case 'admin':
        return 'Full access';

      case 'member':
        return 'Standard access';

      case 'viewer':
        return 'View only';

      default:
        return 'Restricted';
    }
  }

  /**
   * Returns joined date in readable format.
   */
  protected getJoinedDate(member: Member): string {
    if (!member.joined_at) {
      return '—';
    }

    const date = new Date(member.joined_at);

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
   * Format UUID for UI.
   *
   * Example:
   *
   * d56dda13-ee47-4329-bd25-9887d496254d
   *
   * becomes:
   *
   * d56dda13...96254d
   */
  protected formatUuid(value: string): string {
    if (!value) {
      return 'Unknown user';
    }

    if (value.length <= 18) {
      return value;
    }

    return `${value.substring(0, 8)}...` + `${value.substring(value.length - 6)}`;
  }

  /**
   * Copy user UUID to clipboard.
   */
  protected async copyUserId(member: Member): Promise<void> {
    if (!member.user_id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(member.user_id);
    } catch (error) {
      console.error('Unable to copy user ID', error);
    }
  }

  /**
   * Role update handler.
   */
  protected onRoleChange(member: Member, role: string): void {
    const newRole = role as OrganizationRole;

    if (member.role === newRole) {
      return;
    }

    this.roleChange.emit({
      member,
      role: newRole,
    });
  }

  /**
   * Whether member role can be changed.
   *
   * Backend does not allow changing owner role.
   */
  protected canChangeRole(member: Member): boolean {
    return member.role !== 'owner';
  }

  /**
   * Check UUID.
   */
  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
