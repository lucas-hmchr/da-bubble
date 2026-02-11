import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-policy-view',
  standalone: true,
  imports: [],
  templateUrl: './policy-view.html',
  styleUrl: './policy-view.scss',
})
export class PolicyView implements OnInit {
  pageType: 'impressum' | 'datenschutz' = 'impressum';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit() {
    const currentPath = this.route.snapshot.url[0]?.path;

    if (currentPath === 'datenschutz') {
      this.pageType = 'datenschutz';
    } else if (currentPath === 'impressum') {
      this.pageType = 'impressum';
    }
  }

  previousSite() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
