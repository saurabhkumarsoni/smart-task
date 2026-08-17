import { ChangeDetectionStrategy, Component } from '@angular/core';

import { OrganizationsPage } from '../../organizations';

@Component({
  selector: 'app-organization-detail',
  standalone: true,

  imports: [OrganizationsPage],

  template: ` <app-organizations /> `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDetailComponent {}
