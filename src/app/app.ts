import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeftMenu } from "./components/layout/left-menu/left-menu";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LeftMenu],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('da-bubble');
}
