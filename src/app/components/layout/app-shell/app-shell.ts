import { Component, effect } from '@angular/core';
import { Topbar } from "../topbar/topbar";
import { View } from '../view/view';
import { WorkspaceSidebar } from '../workspace-sidebar/workspace-sidebar';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [Topbar, View, WorkspaceSidebar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  constructor(private authService: AuthService) {
    effect(() => {
      console.log('activeUser in AppShell:', this.authService.activeUser());
    });
  }
}
