import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, ActivatedRoute, Router, NavigationEnd, RouterLink } from "@angular/router";
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, startWith, map } from 'rxjs';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-auth-view',
  imports: [RouterOutlet, RouterLinkWithHref, RouterLink],
  templateUrl: './auth-view.html',
  styleUrl: './auth-view.scss',
})
export class AuthView {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly screenWidth = signal(window.innerWidth);

    constructor(private authService: AuthService) {
    effect(() => {
      console.log('activeUser in AppShell:', this.authService.activeUser());
    });
  }

  currentChildPath = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.route.firstChild?.routeConfig?.path ?? '')
    ),
    { initialValue: this.route.firstChild?.routeConfig?.path ?? '' }
  );

  showRegistrationLink = computed(() => this.currentChildPath() === 'login');
  readonly isMobile = computed(() => this.screenWidth() < 640);
  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    const target = event.target as Window;
    this.screenWidth.set(target.innerWidth);
  }
}
