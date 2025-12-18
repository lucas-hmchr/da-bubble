import { Component, effect, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { Toast } from './components/shared/toast/toast';
import { ProfilePopup } from "./components/shared/profile-popup/profile-popup";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, ProfilePopup],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('da-bubble');

  constructor(private authService: AuthService) {
    // this.authService.logout();
    setInterval(() => {
      this.authService.pingUser();
    }, 60_000)
  }

}
