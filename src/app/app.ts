import { Component, effect, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkspaceSidebar } from "./components/layout/workspace-sidebar/workspace-sidebar";
import { AuthService } from './auth/auth.service';
import { Toast } from './components/shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorkspaceSidebar, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('da-bubble');

  constructor(private authService: AuthService) {
    // this.authService.logout();
  }

}
