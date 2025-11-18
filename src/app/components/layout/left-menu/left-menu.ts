import { Component, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-left-menu',
  imports: [MatSidenavModule, MatButtonModule, MatExpansionModule, MatIconModule],
  templateUrl: './left-menu.html',
  styleUrl: './left-menu.scss',
})
export class LeftMenu {
  readonly panelOpenState = signal(false);
}
