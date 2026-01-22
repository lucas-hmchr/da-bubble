import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthService } from '../../../auth/auth.service';
import { SearchService } from '../../../services/search.topbar.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { ChannelService } from '../../../services/channel.service';
import { UserService } from '../../../services/user.service';
import { ChatContextService } from '../../../services/chat-context.service';
import { User } from '../../../models/user.model';
import { Channel } from '../../../models/channel.interface';
import { getAvatarById } from '../../../../shared/data/avatars';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-topbar',
  imports: [FormsModule, CommonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar implements OnInit, OnDestroy {
  private breakpointObserver = inject(BreakpointObserver);
  private firestore = inject(FirestoreService);
  private channelService = inject(ChannelService);
  private chatContext = inject(ChatContextService);
  public userService = inject(UserService);
  private destroy$ = new Subject<void>();

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

  editNameValue = '';

  showUserSuggestions = signal(false);
  showChannelSuggestions = signal(false);
  filteredUsers = signal<User[]>([]);
  filteredChannels = signal<Channel[]>([]);

  allUsers = computed(() => {
    const currentUid = this.auth.uid();
    return this.firestore.userList().filter(u => u.uid !== currentUid);
  });

  allChannels = computed(() => this.channelService.channels());

  currentUser = computed(() => {
    const uid = this.auth.uid();
    if (!uid) return null;
    return this.firestore.userList().find(u => u.uid === uid) || null;
  });

  constructor(
    private auth: AuthService,
    private searchService: SearchService,
  ) {
    this.breakpointObserver.observe(['(max-width: 375px)']).subscribe((result) => {
      this.MobileProfil = result.matches;
    });
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 1024);
    });
  }

  ngOnInit() {
    document.addEventListener('click', () => {
      this.isDropdownMenuOpen = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput() {
    const query = this.searchQuery.trim();

    if (query.startsWith('@')) {
      this.showUserSuggestions.set(true);
      this.showChannelSuggestions.set(false);
      
      const searchTerm = query.substring(1).toLowerCase();
      
      if (searchTerm.length === 0) {
        this.filteredUsers.set(this.allUsers());
      } else {
        this.filteredUsers.set(
          this.allUsers().filter(user =>
            user.displayName?.toLowerCase().includes(searchTerm) ||
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm)
          )
        );
      }
      return;
    }

    if (query.startsWith('#')) {
      this.showChannelSuggestions.set(true);
      this.showUserSuggestions.set(false);
      
      const searchTerm = query.substring(1).toLowerCase();
      
      if (searchTerm.length === 0) {
        this.filteredChannels.set(this.allChannels());
      } else {
        this.filteredChannels.set(
          this.allChannels().filter(channel =>
            channel.name?.toLowerCase().includes(searchTerm) ||
            channel.description?.toLowerCase().includes(searchTerm)
          )
        );
      }
      return;
    }

    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
    this.searchService.updateSearchQuery(query);
  }

  selectUser(user: User) {
    if (!user.uid) return;
    
    this.chatContext.openConversation(user.uid);
    
    this.searchQuery = '';
    this.showUserSuggestions.set(false);
    this.filteredUsers.set([]);
  }

  selectChannel(channel: Channel) {
    if (!channel.id) return;
    
    this.chatContext.openChannel(channel.id);
    
    this.searchQuery = '';
    this.showChannelSuggestions.set(false);
    this.filteredChannels.set([]);
  }

  onSearchFocus() {
    this.isSearchFocused = true;

    if (this.searchQuery.startsWith('@')) {
      this.showUserSuggestions.set(true);
      const searchTerm = this.searchQuery.substring(1).toLowerCase();
      
      if (searchTerm.length === 0) {
        this.filteredUsers.set(this.allUsers());
      } else {
        this.filteredUsers.set(
          this.allUsers().filter(user =>
            user.displayName?.toLowerCase().includes(searchTerm) ||
            user.name?.toLowerCase().includes(searchTerm)
          )
        );
      }
    } else if (this.searchQuery.startsWith('#')) {
      this.showChannelSuggestions.set(true);
      const searchTerm = this.searchQuery.substring(1).toLowerCase();
      
      if (searchTerm.length === 0) {
        this.filteredChannels.set(this.allChannels());
      } else {
        this.filteredChannels.set(
          this.allChannels().filter(channel =>
            channel.name?.toLowerCase().includes(searchTerm)
          )
        );
      }
    }
  }

  onSearchBlur() {
    setTimeout(() => {
      this.isSearchFocused = false;
      this.showUserSuggestions.set(false);
      this.showChannelSuggestions.set(false);
    }, 200);
  }

  clearSearch() {
    this.searchQuery = '';
    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
    this.filteredUsers.set([]);
    this.filteredChannels.set([]);
    this.searchService.clearSearch();
  }

  getAvatarSrc(user: User): string {
    if (user.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return '/assets/images/avatars/avatar_default.svg';
  }

  getCurrentUserAvatar(): string {
    const user = this.currentUser();
    if (!user) return '/assets/images/avatars/avatar_default.svg';
    return this.getAvatarSrc(user);
  }

  getCurrentUserOnlineStatus(): string {
    const user = this.currentUser();
    if (!user) return '/assets/icons/global/Offline.svg';
    return this.userService.getOnlineStatusIcon(user);
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
    const user = this.currentUser();
    this.editNameValue = user?.displayName || user?.name || '';
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

  async saveProfileName() {
    const newName = this.editNameValue.trim();
    
    if (!newName) {
      alert('Bitte gib einen Namen ein.');
      return;
    }

    const user = this.currentUser();
    if (!user?.uid) {
      alert('Fehler: Benutzer nicht gefunden.');
      return;
    }

    try {
      await this.auth.updateUserName(newName);
      
      this.closeProfilEditModal();
      
      console.log('Name erfolgreich geändert:', newName);
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Namens.');
    }
  }

  async onLogout(event: Event) {
    event.stopPropagation();
    this.isDropdownMenuOpen = false;
    await this.auth.logout();
  }
}