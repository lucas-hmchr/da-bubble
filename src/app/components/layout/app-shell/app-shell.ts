import { Component } from '@angular/core';
import { Topbar } from "../topbar/topbar";

@Component({
  selector: 'app-app-shell',
  imports: [Topbar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {

}
