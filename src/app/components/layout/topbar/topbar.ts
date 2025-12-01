import { Component } from '@angular/core';

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
    this.isProfilModalOpen = false; // ← Schließt das Profil-Modal
    document.body.style.overflow = 'hidden';
  }

  closeProfilEditModal() {
    this.isProfilEditModalOpen = false;
    document.body.style.overflow = '';
  }

  ngOnInit() {
    document.addEventListener('click', () => {
      this.isDropdownMenuOpen = false;
    });
  }
}
