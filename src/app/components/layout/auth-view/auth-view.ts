import { Component, computed, inject } from '@angular/core';
import { Logo } from "../../shared/logo/logo";
import { RouterOutlet, RouterLinkWithHref, ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, startWith, map } from 'rxjs';

@Component({
  selector: 'app-auth-view',
  imports: [Logo, RouterOutlet, RouterLinkWithHref],
  templateUrl: './auth-view.html',
  styleUrl: './auth-view.scss',
})
export class AuthView {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentChildPath = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.route.firstChild?.routeConfig?.path ?? '')
    ),
    { initialValue: this.route.firstChild?.routeConfig?.path ?? '' }
  );

  showRegistrationLink = computed(() => this.currentChildPath() === 'login')
}
