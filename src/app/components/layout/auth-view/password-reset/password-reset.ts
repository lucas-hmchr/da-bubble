import { Component, computed, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Auth } from '@angular/fire/auth';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { CdkOverlayOrigin } from "@angular/cdk/overlay";

@Component({
  selector: 'app-password-reset',
  imports: [FormsModule, RouterLink, CdkOverlayOrigin],
  templateUrl: './password-reset.html',
  styleUrl: './password-reset.scss',
})
export class PasswordReset {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);

  newPassword = '';
  newPasswordRepeat = '';

  oobCode = '';
  emailForReset = '';
  linkError: string | null = null;
  loading = false;

  get pwIdentical(): boolean {
    return (
      this.newPassword !== '' &&
      this.newPasswordRepeat !== '' &&
      this.newPassword === this.newPasswordRepeat
    )
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe(async (qp) => {
      this.linkError = null;

      const mode = qp.get('mode');
      const code = qp.get('oobCode');

      if (!mode && !code) {
        this.linkError = 'Bitte öffne den Link aus der Passwort-Reset E-Mail.';
        return;
      }
      if (mode !== 'resetPassword' || !code) {
        this.linkError = 'Ungültiger Link.';
        return;
      }

      this.oobCode = code;

      try {
        this.emailForReset = await verifyPasswordResetCode(this.auth, this.oobCode);
      } catch (e) {
        this.linkError = 'Dieser Link ist abgelaufen oder ungültig. Bitte fordere einen neuen an.';
        this.oobCode = '';
      }
    });
  }

  async updatePw() {
    if (!this.oobCode) {
      this.linkError = 'Bitte öffne den Link aus der Passwort-Reset E-Mail.';
      return;
    }
    if (!this.pwIdentical) return;
    this.loading = true;
    this.linkError = null;
    try {
      await confirmPasswordReset(this.auth, this.oobCode, this.newPassword);
      await this.router.navigateByUrl('/auth/login?reset=1');
    } catch (e) {
      this.linkError = 'Passwort konnte nicht gesetzt werden. Link ggf. abgelaufen – bitte neu anfordern.';
    } finally {
      this.loading = false;
    }
  }
}
