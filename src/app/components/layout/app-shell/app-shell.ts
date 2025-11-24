import { Component } from '@angular/core';
import { Topbar } from "../topbar/topbar";
import { View } from '../view/view';
import { WorkspaceSidebar } from '../workspace-sidebar/workspace-sidebar';

@Component({
  selector: 'app-app-shell',
  imports: [Topbar, View, WorkspaceSidebar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {

}
