import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Member, Organization } from '../../core/models/app-models';
import { OrganizationService } from '../../core/services/organization.service';

@Component({
  selector: 'app-organizations', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <section class="page-card"><div class="page-title"><h2>Organizations</h2><button (click)="editing.set({ name: '', slug: '', description: '' })">Create organization</button></div>
    @if (editing()) { <form class="form" (ngSubmit)="save()"><input [(ngModel)]="editing()!.name" name="name" placeholder="Organization name" required><input [(ngModel)]="editing()!.slug" name="slug" placeholder="Slug" [disabled]="!!editing()!.id" required><textarea [(ngModel)]="editing()!.description" name="description" placeholder="Description"></textarea><button>Save</button><button type="button" (click)="editing.set(null)">Cancel</button></form> }
    <div class="grid">@for (org of organizations(); track org.id) { <article class="card" (click)="select(org)"><h3>{{ org.name }}</h3><p>{{ org.description || 'No description' }}</p><small>{{ org.slug }}</small><button (click)="$event.stopPropagation(); beginEdit(org)">Edit</button></article> }</div>
    @if (selected()) { <section class="details"><h3>{{ selected()!.name }} members</h3><form (ngSubmit)="invite()"><input [(ngModel)]="inviteUserId" name="userId" placeholder="User UUID" required><select [(ngModel)]="inviteRole" name="role"><option value="member">Member</option><option value="admin">Admin</option><option value="viewer">Viewer</option></select><button>Invite</button></form><table><tr><th>Member</th><th>Email</th><th>Role</th></tr>@for (member of members(); track member.id) { <tr><td>{{ member.user_name || member.user_id }}</td><td>{{ member.user_email }}</td><td><select [ngModel]="member.role" (ngModelChange)="changeRole(member, $event)"><option value="admin">Admin</option><option value="member">Member</option><option value="viewer">Viewer</option></select></td></tr> }</table></section> }
    </section>`,
  styles: [`.page-card{padding:20px}.page-title{display:flex;justify-content:space-between}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}.card,.details,.form{border:1px solid #334155;border-radius:12px;padding:14px;margin-top:14px}.card{cursor:pointer}.form{display:grid;gap:8px}input,textarea,select{padding:8px}table{width:100%;margin-top:12px;text-align:left}`],
})
export class OrganizationsPage implements OnInit {
  private readonly service = inject(OrganizationService); protected readonly organizations = signal<Organization[]>([]); protected readonly selected = signal<Organization | null>(null); protected readonly members = signal<Member[]>([]); protected readonly editing = signal<Partial<Organization> | null>(null); protected inviteUserId = ''; protected inviteRole: Member['role'] = 'member';
  ngOnInit() { this.load(); }
  protected select(org: Organization) { this.selected.set(org); this.service.members(org.id).subscribe((members) => this.members.set(members)); }
  protected beginEdit(org: Organization) { this.editing.set({ ...org }); }
  protected save() { const item = this.editing(); if (!item?.name) return; const request = item.id ? this.service.update(item.id, item) : this.service.create({ name: item.name, slug: item.slug || item.name.toLowerCase().replaceAll(' ', '-'), description: item.description }); request.subscribe((saved) => { this.editing.set(null); this.load(); this.select(saved); }); }
  protected invite() { const org = this.selected(); if (!org || !this.inviteUserId) return; this.service.invite(org.id, this.inviteUserId, this.inviteRole).subscribe(() => { this.inviteUserId = ''; this.select(org); }); }
  protected changeRole(member: Member, role: Member['role']) { const org = this.selected(); if (org) this.service.updateRole(org.id, member.user_id, role).subscribe(() => this.select(org)); }
  private load() { this.service.list().subscribe((items) => this.organizations.set(items)); }
}
