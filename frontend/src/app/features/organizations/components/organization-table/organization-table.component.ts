import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Organization } from '../../../../core/models/app-models';

import {
  DataTableColumn,
  DataTableComponent,
} from '../../../../shared/components/data-table/data-table.component';

import { DataTableCellDirective } from '../../../../shared/components/data-table/data-table-cell.directive';

@Component({
  selector: 'app-organization-table',
  standalone: true,

  imports: [CommonModule, FormsModule, DataTableComponent, DataTableCellDirective],

  templateUrl: './organization-table.component.html',

  styleUrl: './organization-table.component.scss',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationTableComponent {
  @Input()
  organizations: Organization[] = [];

  @Input()
  loading = false;

  @Input()
  selectedOrganizationId: string | null = null;

  @Input()
  searchTerm = '';

  @Input()
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  @Input()
  memberCountResolver: ((organizationId: string) => number) | null = null;

  @Input()
  statusResolver: ((organization: Organization) => 'active' | 'inactive') | null = null;

  @Input()
  createdDateResolver: ((organization: Organization) => string) | null = null;

  @Output()
  searchTermChange = new EventEmitter<string>();

  @Output()
  statusFilterChange = new EventEmitter<'all' | 'active' | 'inactive'>();

  @Output()
  selectOrganization = new EventEmitter<Organization>();

  @Output()
  editOrganization = new EventEmitter<Organization>();

  readonly columns: DataTableColumn<Organization>[] = [
    {
      key: 'organization',
      label: 'Organization',
      width: '32%',
    },

    {
      key: 'slug',
      label: 'Slug',
      width: '18%',
    },

    {
      key: 'members',
      label: 'Members',
      width: '12%',
      align: 'center',
    },

    {
      key: 'status',
      label: 'Status',
      width: '14%',
    },

    {
      key: 'created',
      label: 'Created',
      width: '14%',
    },

    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      align: 'right',
    },
  ];

  protected getInitials(name: string): string {
    if (!name?.trim()) {
      return 'OR';
    }

    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  protected onSearch(value: string): void {
    this.searchTermChange.emit(value);
  }

  protected onStatusChange(value: string): void {
    this.statusFilterChange.emit(value as 'all' | 'active' | 'inactive');
  }

  protected clearSearch(): void {
    this.searchTermChange.emit('');
  }

  protected view(organization: Organization): void {
    this.selectOrganization.emit(organization);
  }

  protected edit(organization: Organization, event: Event): void {
    event.stopPropagation();

    this.editOrganization.emit(organization);
  }

  protected getMemberCount(organizationId: string): number {
    return this.memberCountResolver ? this.memberCountResolver(organizationId) : 0;
  }

  protected getStatus(organization: Organization): 'active' | 'inactive' {
    return this.statusResolver
      ? this.statusResolver(organization)
      : organization.is_active
        ? 'active'
        : 'inactive';
  }

  protected getCreatedDate(organization: Organization): string {
    return this.createdDateResolver ? this.createdDateResolver(organization) : '—';
  }
}
