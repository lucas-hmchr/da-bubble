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

  toggleDropdownMenu(event: Event) {
    event.stopPropagation();
    this.isDropdownMenuOpen = !this.isDropdownMenuOpen;
  }

  openProfilModal() {
    this.isProfilModalOpen = true;
    this.isDropdownMenuOpen = false;
  }

  closeProfilModal() {
    this.isProfilModalOpen = false;
  }

  ngOnInit() {
    document.addEventListener('click', () => {
      this.isDropdownMenuOpen = false;
    });
  }
}
