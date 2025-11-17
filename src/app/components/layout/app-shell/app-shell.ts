import { Component } from '@angular/core';
import { Topbar } from "../topbar/topbar";
import { View } from '../view/view';
import { LeftMenu } from '../left-menu/left-menu';

@Component({
  selector: 'app-app-shell',
  imports: [Topbar, View, LeftMenu],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {

}
