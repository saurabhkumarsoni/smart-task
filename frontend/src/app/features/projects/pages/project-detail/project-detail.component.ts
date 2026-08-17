import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import {
  Project,
  ProjectMember,
  ProjectMemberRole,
  ProjectOverview,
  Sprint,
} from '../../../../core/models/app-models';

import { ProjectMemberService } from '../../../../core/services/project-member.service';
import { ProjectService } from '../../../../core/services/project.service';
import { SprintService } from '../../../../core/services/sprint.service';

import { ProjectMembersComponent } from '../../components/project-members/project-members.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, ProjectMembersComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly projectsApi = inject(ProjectService);
  private readonly membersApi = inject(ProjectMemberService);
  private readonly sprintsApi = inject(SprintService);

  protected projectId = '';

  protected readonly project = signal<Project | null>(null);

  protected readonly overview = signal<ProjectOverview | null>(null);

  protected readonly members = signal<ProjectMember[]>([]);

  protected readonly sprints = signal<Sprint[]>([]);

  protected readonly tab = signal<'overview' | 'members' | 'sprints' | 'settings'>('overview');

  protected loadingProject = false;
  protected loadingMembers = false;
  protected loadingSprints = false;

  protected inviting = false;
  protected updatingMemberId: string | null = null;
  protected removingMemberId: string | null = null;

  protected savingProject = false;
  protected deletingProject = false;
  protected creatingSprint = false;

  protected inviteUserId = '';

  protected inviteRole: ProjectMemberRole = 'member';

  protected memberSearch = '';

  protected sprintDraft: Partial<Sprint> = {
    name: '',
    goal: '',
    start_date: null,
    end_date: null,
    is_active: true,
  };

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.projectId) {
      return;
    }

    this.loadProject();
    this.loadOverview();
    this.loadMembers();
    this.loadSprints();
  }

  protected setTab(tab: 'overview' | 'members' | 'sprints' | 'settings'): void {
    this.tab.set(tab);

    if (tab === 'members') {
      this.loadMembers();
    }

    if (tab === 'sprints') {
      this.loadSprints();
    }

    if (tab === 'overview') {
      this.loadOverview();
    }
  }

  protected progress(): number {
    const overview = this.overview();

    if (!overview || !overview.total_tasks) {
      return 0;
    }

    return Math.min(100, Math.round((overview.completed_tasks / overview.total_tasks) * 100));
  }

  protected projectInitials(): string {
    const name = this.project()?.name?.trim();

    if (!name) {
      return 'PR';
    }

    const words = name.split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  protected getProjectStatus(): string {
    return this.project()?.is_active === false ? 'Inactive' : 'Active';
  }

  protected getSprintStatus(sprint: Sprint): string {
    return sprint.is_active ? 'Active' : 'Closed';
  }

  protected loadProject(): void {
    this.loadingProject = true;

    this.projectsApi.getProject(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);
      },

      error: (error) => {
        console.error('Unable to load project', error);
      },

      complete: () => {
        this.loadingProject = false;
      },
    });
  }

  protected loadOverview(): void {
    this.membersApi.overview(this.projectId).subscribe({
      next: (overview) => {
        this.overview.set(overview);
      },

      error: (error) => {
        console.error('Unable to load project overview', error);
      },
    });
  }

  /**
   * Intentionally protected because it is used
   * directly from the Angular template.
   */
  protected loadMembers(): void {
    if (!this.projectId) {
      return;
    }

    this.loadingMembers = true;

    this.membersApi.members(this.projectId).subscribe({
      next: (members) => {
        this.members.set(members);
      },

      error: (error) => {
        console.error('Unable to load project members', error);
      },

      complete: () => {
        this.loadingMembers = false;
      },
    });
  }

  /**
   * Intentionally protected because it is used
   * directly from the Angular template.
   */
  protected loadSprints(): void {
    if (!this.projectId) {
      return;
    }

    this.loadingSprints = true;

    this.sprintsApi.list(this.projectId).subscribe({
      next: (sprints) => {
        this.sprints.set(sprints);
      },

      error: (error) => {
        console.error('Unable to load sprints', error);
      },

      complete: () => {
        this.loadingSprints = false;
      },
    });
  }

  protected inviteMember(): void {
    const userId = this.inviteUserId.trim();

    if (!userId || this.inviting) {
      return;
    }

    this.inviting = true;

    this.membersApi.invite(this.projectId, userId, this.inviteRole).subscribe({
      next: () => {
        this.inviteUserId = '';

        this.loadMembers();
        this.loadOverview();
      },

      error: (error) => {
        console.error('Unable to invite project member', error);
      },

      complete: () => {
        this.inviting = false;
      },
    });
  }

  protected changeMemberRole(event: { member: ProjectMember; role: ProjectMemberRole }): void {
    const member = event.member;

    if (member.role === event.role || this.updatingMemberId) {
      return;
    }

    this.updatingMemberId = member.user_id;

    this.membersApi.updateRole(this.projectId, member.user_id, event.role).subscribe({
      next: () => {
        this.loadMembers();
      },

      error: (error) => {
        console.error('Unable to update project member role', error);
      },

      complete: () => {
        this.updatingMemberId = null;
      },
    });
  }

  protected removeMember(member: ProjectMember): void {
    if (this.removingMemberId) {
      return;
    }

    const memberName = this.getMemberName(member);

    if (!confirm(`Remove ${memberName} from this project?`)) {
      return;
    }

    this.removingMemberId = member.user_id;

    this.membersApi.remove(this.projectId, member.user_id).subscribe({
      next: () => {
        this.loadMembers();
        this.loadOverview();
      },

      error: (error) => {
        console.error('Unable to remove project member', error);
      },

      complete: () => {
        this.removingMemberId = null;
      },
    });
  }

  protected saveSprint(): void {
    const name = String(this.sprintDraft.name ?? '').trim();

    if (!name || this.creatingSprint) {
      return;
    }

    this.creatingSprint = true;

    this.sprintsApi
      .create(this.projectId, {
        ...this.sprintDraft,
        name,
      })
      .subscribe({
        next: () => {
          this.sprintDraft = {
            name: '',
            goal: '',
            start_date: null,
            end_date: null,
            is_active: true,
          };

          this.loadSprints();
        },

        error: (error) => {
          console.error('Unable to create sprint', error);
        },

        complete: () => {
          this.creatingSprint = false;
        },
      });
  }

  protected toggleSprint(sprint: Sprint): void {
    this.sprintsApi
      .update(this.projectId, sprint.id, {
        is_active: !sprint.is_active,
      })
      .subscribe({
        next: () => {
          this.loadSprints();
        },

        error: (error) => {
          console.error('Unable to update sprint', error);
        },
      });
  }

  protected saveProject(): void {
    const currentProject = this.project();

    if (!currentProject || this.savingProject) {
      return;
    }

    this.savingProject = true;

    this.projectsApi
      .updateProject(currentProject.id, {
        name: currentProject.name,
        description: currentProject.description,
        is_active: currentProject.is_active,
      })
      .subscribe({
        next: (updatedProject) => {
          this.project.set(updatedProject);
        },

        error: (error) => {
          console.error('Unable to update project', error);
        },

        complete: () => {
          this.savingProject = false;
        },
      });
  }

  protected deleteProject(): void {
    const currentProject = this.project();

    if (!currentProject || this.deletingProject) {
      return;
    }

    if (!confirm(`Delete "${currentProject.name}"? This action cannot be undone.`)) {
      return;
    }

    this.deletingProject = true;

    this.projectsApi.deleteProject(currentProject.id).subscribe({
      next: () => {
        this.router.navigateByUrl('/projects');
      },

      error: (error) => {
        console.error('Unable to delete project', error);

        this.deletingProject = false;
      },
    });
  }

  protected getMemberName(member: ProjectMember): string {
    const user = member.user;

    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();

    return (
      fullName ||
      user?.username ||
      user?.email ||
      member.user_name ||
      member.user_email ||
      member.user_id
    );
  }
}
