import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, startWith, map } from 'rxjs';

@Component({
  selector: 'app-auth-view',
  imports: [RouterOutlet, RouterLinkWithHref],
  templateUrl: './auth-view.html',
  styleUrl: './auth-view.scss',
})
export class AuthView {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly screenWidth = signal(window.innerWidth);

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
