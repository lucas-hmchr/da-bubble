import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthService } from '../../../auth/auth.service';
import { SearchService } from '../../../services/search.topbar.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  imports: [FormsModule, CommonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private breakpointObserver = inject(BreakpointObserver);
  @Input() isNewMessageMode = false;
  @Input() showMobileBack = false;

  @Output() back = new EventEmitter<void>();

  isMobile = signal(window.innerWidth < 1024);
  isDropdownMenuOpen = false;
  isProfilModalOpen = false;
  isProfilEditModalOpen = false;
  activeProfilName: string | null = null;
  MobileProfil = false;

  searchQuery = '';
  isSearchFocused = false;

  showUserSuggestions = false;
  filteredUsers: any[] = [];

  allUsers = [
    {
      id: 1,
      name: 'Frederik Beck',
      avatar: '/assets/icons/global/Avatar.svg',
      online: true,
      isYou: true,
    },
    {
      id: 2,
      name: 'Sofia Müller',
      avatar: '/assets/icons/global/Avatar.svg',
      online: true,
      isYou: false,
    },
    {
      id: 3,
      name: 'Noah Braun',
      avatar: '/assets/icons/global/Avatar.svg',
      online: true,
      isYou: false,
    },
    {
      id: 4,
      name: 'Elise Roth',
      avatar: '/assets/icons/global/Avatar.svg',
      online: false,
      isYou: false,
    },
    {
      id: 5,
      name: 'Elias Neumann',
      avatar: '/assets/icons/global/Avatar.svg',
      online: true,
      isYou: false,
    },
    {
      id: 6,
      name: 'Steffen Hoffmann',
      avatar: '/assets/icons/global/Avatar.svg',
      online: false,
      isYou: false,
    },
  ];

  constructor(private auth: AuthService, private searchService: SearchService) {
    this.breakpointObserver.observe(['(max-width: 375px)']).subscribe((result) => {
      this.MobileProfil = result.matches;
    });
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 1024);
    });
  }

  onSearchInput() {
    if (this.searchQuery.startsWith('@')) {
      this.showUserSuggestions = true;
      const searchTerm = this.searchQuery.substring(1).toLowerCase();

      if (searchTerm.length === 0) {
        this.filteredUsers = this.allUsers;
      } else {
        this.filteredUsers = this.allUsers.filter((user) =>
          user.name.toLowerCase().includes(searchTerm)
        );
      }
    } else {
      this.showUserSuggestions = false;
      this.filteredUsers = [];
      this.searchService.updateSearchQuery(this.searchQuery);
    }
  }

  selectUser(user: any) {
    console.log('User selected:', user);
    this.searchQuery = '@' + user.name;
    this.showUserSuggestions = false;
    this.filteredUsers = [];
  }

  onSearchFocus() {
    this.isSearchFocused = true;

    if (this.searchQuery.startsWith('@')) {
      this.showUserSuggestions = true;
      const searchTerm = this.searchQuery.substring(1).toLowerCase();
      this.filteredUsers =
        searchTerm.length === 0
          ? this.allUsers
          : this.allUsers.filter((user) => user.name.toLowerCase().includes(searchTerm));
    }
  }

  onSearchBlur() {
    setTimeout(() => {
      this.isSearchFocused = false;
      this.showUserSuggestions = false;
    }, 200);
  }

  clearSearch() {
    this.searchQuery = '';
    this.showUserSuggestions = false;
    this.filteredUsers = [];
    this.searchService.clearSearch();
  }

  toggleDropdownMenu(event: Event) {
    event.stopPropagation();
    this.isDropdownMenuOpen = !this.isDropdownMenuOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownMenuOpen = false;
  }

  openProfilModal() {
    this.activeProfilName = 'profil';
    this.isProfilModalOpen = true;

    if (!this.MobileProfil) {
      this.isDropdownMenuOpen = false;
    }

    document.body.style.overflow = 'hidden';
  }

  openProfilEditModal() {
    this.isProfilEditModalOpen = true;
    this.isProfilModalOpen = false;
    document.body.style.overflow = 'hidden';
  }

  closeProfilModalOnly() {
    this.activeProfilName = null;
    this.isProfilModalOpen = false;
    this.isDropdownMenuOpen = false;
    document.body.style.overflow = '';
  }

  closeProfilEditModalOnly() {
    this.isProfilEditModalOpen = false;
    document.body.style.overflow = '';
  }

  closeProfilModal() {
    this.activeProfilName = null;
    this.isProfilModalOpen = false;
    this.isDropdownMenuOpen = false;
    document.body.style.overflow = '';
  }

  closeProfilEditModal() {
    this.activeProfilName = null;
    this.isProfilEditModalOpen = false;
    document.body.style.overflow = '';
  }

  async onLogout(event: Event) {
    event.stopPropagation();
    this.isDropdownMenuOpen = false;
    await this.auth.logout();
  }

  ngOnInit() {
    document.addEventListener('click', () => {
      this.isDropdownMenuOpen = false;
    });
  }
}
