import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-security-info',
  standalone: true,
  templateUrl: './security-info.component.html',
  styleUrl: './security-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityInfoComponent {}
