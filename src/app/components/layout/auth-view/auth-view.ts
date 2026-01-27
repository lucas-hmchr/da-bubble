import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import {
  RouterOutlet,
  RouterLinkWithHref,
  ActivatedRoute,
  Router,
  NavigationEnd,
  RouterLink
} from "@angular/router";
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

  @ViewChild('splash', { static: true }) splash!: ElementRef<HTMLElement>;
  @ViewChild('splashLogo', { static: true }) splashLogo!: ElementRef<HTMLElement>; // logo-container
  @ViewChild('targetLogo', { static: true }) targetLogo!: ElementRef<HTMLElement>;
  @ViewChild('splashIcon', { static: true }) splashIcon!: ElementRef<HTMLElement>;

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

  ngAfterViewInit() {
    this.runAfterLayoutStable(() => this.animateSplashToHeader());
  }

  private runAfterLayoutStable(fn: () => void) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  private animateSplashToHeader() {
    const splashEl = this.splash.nativeElement;
    const movingEl = this.splashLogo.nativeElement;
    const iconEl = this.splashIcon.nativeElement;
    const targetEl = this.targetLogo.nativeElement;

    const flyDelayMs = 1600;
    const flyDurationMs = 550;

    this.hideTargetLogo(targetEl);

    window.setTimeout(() => {
      const { dx, dy } = this.computeTranslation(iconEl, targetEl);
      const finalScale = 1;

      this.runMoveAnimation(movingEl, dx, dy, finalScale, flyDurationMs, () => {
        this.showTargetLogo(targetEl);
        this.fadeOutAndRemove(splashEl, 250);
      });
    }, flyDelayMs);
  }

  private computeTranslation(iconEl: HTMLElement, targetEl: HTMLElement) {
    const fromIcon = iconEl.getBoundingClientRect();
    const to = targetEl.getBoundingClientRect();

    const fromCx = fromIcon.left + fromIcon.width / 2;
    const fromCy = fromIcon.top + fromIcon.height / 2;

    const toCx = to.left + (fromIcon.width / 2);
    const toCy = to.top + to.height / 2;

    return {
      dx: toCx - fromCx,
      dy: toCy - fromCy,
    };
  }

  private runMoveAnimation(
    movingEl: HTMLElement,
    dx: number,
    dy: number,
    scale: number,
    durationMs: number,
    onFinish: () => void
  ) {
    const keyframes: Keyframe[] = [
      { transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1)' },
      { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${scale})` }
    ];

    const timing: KeyframeAnimationOptions = {
      duration: durationMs,
      easing: 'cubic-bezier(.22,.61,.36,1)',
      fill: 'forwards'
    };

    movingEl.animate(keyframes, timing).onfinish = onFinish;
  }

  private fadeOutAndRemove(el: HTMLElement, durationMs: number) {
    el.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: durationMs, easing: 'ease', fill: 'forwards' }
    ).onfinish = () => el.remove();
  }

  private hideTargetLogo(targetEl: HTMLElement) {
    targetEl.style.visibility = 'hidden';
  }

  private showTargetLogo(targetEl: HTMLElement) {
    targetEl.style.visibility = 'visible';
  }

}
