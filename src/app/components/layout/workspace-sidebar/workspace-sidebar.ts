import { Component, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-workspace-sidebar',
  imports: [MatSidenavModule, MatButtonModule, MatExpansionModule, MatIconModule],
  templateUrl: './workspace-sidebar.html',
  styleUrl: './workspace-sidebar.scss',
})
export class LeftMenu {
  readonly channelOpen = signal(false);
  readonly dmOpen = signal(false);
}
