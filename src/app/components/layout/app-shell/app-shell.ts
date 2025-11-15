import { Component } from '@angular/core';
import { Topbar } from "../topbar/topbar";
import { View } from '../view/view';

@Component({
  selector: 'app-app-shell',
  imports: [Topbar,View],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {

}
