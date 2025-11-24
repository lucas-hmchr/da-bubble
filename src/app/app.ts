import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkspaceSidebar } from "./components/layout/workspace-sidebar/workspace-sidebar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WorkspaceSidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('da-bubble');
}
