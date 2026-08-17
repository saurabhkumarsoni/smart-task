import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Project,
  ProjectMember,
  ProjectMemberRole,
} from '../../../../core/models/app-models';

@Component({
  selector: 'app-project-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-members.component.html',
  styleUrl: './project-members.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersComponent {
  @Input()
  project: Project | null = null;

  @Input()
  members: ProjectMember[] = [];

  @Input()
  loading = false;

  @Input()
  inviting = false;

  @Input()
  updatingMemberId: string | null = null;

  @Input()
  removingMemberId: string | null = null;

  @Input()
  inviteUserId = '';

  @Input()
  inviteRole: ProjectMemberRole = 'member';

  @Input()
  search = '';

  @Output()
  inviteUserIdChange = new EventEmitter<string>();

  @Output()
  inviteRoleChange = new EventEmitter<ProjectMemberRole>();

  @Output()
  searchChange = new EventEmitter<string>();

  @Output()
  inviteMember = new EventEmitter<void>();

  @Output()
  roleChange = new EventEmitter<{
    member: ProjectMember;
    role: ProjectMemberRole;
  }>();

  @Output()
  removeMember = new EventEmitter<ProjectMember>();

  @Output()
  refresh = new EventEmitter<void>();

  protected get filteredMembers(): ProjectMember[] {
    const query = this.search.trim().toLowerCase();

    if (!query) {
      return this.members;
    }

    return this.members.filter((member) => {
      const user = member.user;

      const searchableText = [
        user?.first_name,
        user?.last_name,
        user?.username,
        user?.email,
        member.user_name,
        member.user_email,
        member.user_id,
        member.role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }

  protected getMemberDisplayName(member: ProjectMember): string {
    const user = member.user;

    const fullName = [
      user?.first_name,
      user?.last_name,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (fullName) {
      return fullName;
    }

    if (user?.username?.trim()) {
      return user.username.trim();
    }

    if (member.username?.trim()) {
      return member.username.trim();
    }

    if (user?.email?.trim()) {
      return user.email.trim();
    }

    if (member.user_email?.trim()) {
      return member.user_email.trim();
    }

    return this.formatUuid(member.user_id);
  }

  protected getMemberEmail(member: ProjectMember): string {
    return (
      member.user?.email?.trim() ||
      member.user_email?.trim() ||
      'Email unavailable'
    );
  }

  protected getMemberUsername(member: ProjectMember): string {
    return (
      member.user?.username?.trim() ||
      member.username?.trim() ||
      ''
    );
  }

  protected getInitials(member: ProjectMember): string {
    const user = member.user;

    const firstName = user?.first_name?.trim();
    const lastName = user?.last_name?.trim();

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }

    if (lastName) {
      return lastName.substring(0, 2).toUpperCase();
    }

    const username = user?.username?.trim();

    if (username) {
      return username.substring(0, 2).toUpperCase();
    }

    const email = user?.email?.trim();

    if (email) {
      return email.substring(0, 2).toUpperCase();
    }

    return member.user_id
      .replaceAll('-', '')
      .substring(0, 2)
      .toUpperCase();
  }

  protected getRoleLabel(role: ProjectMemberRole): string {
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

  protected getAccessLabel(role: ProjectMemberRole): string {
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

  protected getJoinedDate(member: ProjectMember): string {
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

  protected formatUuid(value: string): string {
    if (!value) {
      return 'Unknown user';
    }

    if (value.length <= 18) {
      return value;
    }

    return `${value.substring(0, 8)}...${value.substring(value.length - 6)}`;
  }

  protected onRoleChange(
    member: ProjectMember,
    role: string,
  ): void {
    const newRole = role as ProjectMemberRole;

    if (member.role === newRole) {
      return;
    }

    this.roleChange.emit({
      member,
      role: newRole,
    });
  }

  protected onRemove(member: ProjectMember): void {
    this.removeMember.emit(member);
  }

  protected canChangeRole(member: ProjectMember): boolean {
    return member.role !== 'owner';
  }

  protected async copyUserId(
    member: ProjectMember,
  ): Promise<void> {
    if (!member.user_id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(member.user_id);
    } catch (error) {
      console.error('Unable to copy user ID', error);
    }
  }
}