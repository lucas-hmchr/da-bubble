import { Component } from '@angular/core';
import { AuthService } from '../../../auth/auth.service'; // Pfad ggf. anpassen

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  isDropdownMenuOpen = false;
  isProfilModalOpen = false;
  isProfilEditModalOpen = false;

  constructor(private auth: AuthService) {}   // 👈 AuthService injizieren

  toggleDropdownMenu(event: Event) {
    event.stopPropagation();
    this.isDropdownMenuOpen = !this.isDropdownMenuOpen;
  }

  openProfilModal() {
    this.isProfilModalOpen = true;
    this.isDropdownMenuOpen = false;
    document.body.style.overflow = 'hidden';
  }

  closeProfilModal() {
    this.isProfilModalOpen = false;
    document.body.style.overflow = '';
  }

  openProfilEditModal() {
    this.isProfilEditModalOpen = true;
    this.isProfilModalOpen = false;
    document.body.style.overflow = 'hidden';
  }

  closeProfilEditModal() {
    this.isProfilEditModalOpen = false;
    document.body.style.overflow = '';
  }

  async onLogout(event: Event) {
    event.stopPropagation();          // verhindert, dass der globale Click-Handler triggert
    this.isDropdownMenuOpen = false;  // Menü schließen
    await this.auth.logout();         // 👈 verwendet deine AuthService-Logout-Logik
  }

  ngOnInit() {
    document.addEventListener('click', () => {
      this.isDropdownMenuOpen = false;
    });
  }
}
