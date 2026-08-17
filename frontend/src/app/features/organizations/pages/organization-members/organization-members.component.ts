import { ChangeDetectionStrategy, Component } from '@angular/core';

import { OrganizationsPage } from '../../organizations';

@Component({
  selector: 'app-organization-members-page',
  standalone: true,

  imports: [OrganizationsPage],

  template: ` <app-organizations /> `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationMembersPageComponent {}
