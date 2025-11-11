import { Component } from '@angular/core';
import { Logo } from "../../shared/logo/logo";
import { LoginForm } from "./login-form/login-form";

@Component({
  selector: 'app-auth-view',
  imports: [Logo, LoginForm],
  templateUrl: './auth-view.html',
  styleUrl: './auth-view.scss',
})
export class AuthView {

}
