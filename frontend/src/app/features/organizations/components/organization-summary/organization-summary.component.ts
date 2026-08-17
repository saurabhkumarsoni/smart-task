import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-organization-summary',
  standalone: true,
  templateUrl: './organization-summary.component.html',
  styleUrl: './organization-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSummaryComponent {
  @Input()
  totalOrganizations = 0;

  @Input()
  activeOrganizations = 0;

  @Input()
  selectedMembers = 0;

  @Input()
  administrators = 0;
}
