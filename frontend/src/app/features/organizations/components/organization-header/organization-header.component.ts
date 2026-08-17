import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-organization-header',
  standalone: true,
  templateUrl: './organization-header.component.html',
  styleUrl: './organization-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationHeaderComponent {
  @Input()
  saving = false;

  @Output()
  createOrganization = new EventEmitter<void>();
}