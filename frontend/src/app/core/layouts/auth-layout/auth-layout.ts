import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayoutComponent {
  @Input() eyebrow = 'TaskPilot';
  @Input() title = 'Collaborate with clarity';
  @Input() subtitle = 'A focused workspace for teams to plan, deliver, and move faster.';
}
