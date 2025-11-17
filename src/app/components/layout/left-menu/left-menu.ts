import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-left-menu',
  imports: [MatSidenavModule, MatButtonModule],
  templateUrl: './left-menu.html',
  styleUrl: './left-menu.scss',
})
export class LeftMenu {
  showFiller = false;
}
