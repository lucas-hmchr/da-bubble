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

  // ========== NEUE SEARCH LOGIC ==========
  showUserSuggestions = signal(false);
  showChannelSuggestions = signal(false);
  filteredUsers = signal<User[]>([]);
  filteredChannels = signal<Channel[]>([]);

  // Computed: Alle User außer current user
  allUsers = computed(() => {
    const currentUid = this.auth.uid();
    return this.firestore.userList().filter(u => u.uid !== currentUid);
  });

  // Computed: Alle Channels
  allChannels = computed(() => this.channelService.channels());

  // ========== NEU: Current User Computed ==========
  currentUser = computed(() => {
    const uid = this.auth.uid();
    if (!uid) return null;
    console.log(this.firestore.userList().find(u => u.uid === uid))
    return this.firestore.userList().find(u => u.uid === uid) || null;
  });
  // ========== END NEU ==========

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

  // ========== SEARCH INPUT HANDLER ==========
  onSearchInput() {
    const query = this.searchQuery.trim();

    // @ für User-Suche
    if (query.startsWith('@')) {
      this.showUserSuggestions.set(true);
      this.showChannelSuggestions.set(false);
      
      const searchTerm = query.substring(1).toLowerCase();
      
      if (searchTerm.length === 0) {
        // Zeige alle User
        this.filteredUsers.set(this.allUsers());
      } else {
        // Filtere User
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

    // # für Channel-Suche
    if (query.startsWith('#')) {
      this.showChannelSuggestions.set(true);
      this.showUserSuggestions.set(false);
      
      const searchTerm = query.substring(1).toLowerCase();
      
      if (searchTerm.length === 0) {
        // Zeige alle Channels
        this.filteredChannels.set(this.allChannels());
      } else {
        // Filtere Channels
        this.filteredChannels.set(
          this.allChannels().filter(channel =>
            channel.name?.toLowerCase().includes(searchTerm) ||
            channel.description?.toLowerCase().includes(searchTerm)
          )
        );
      }
      return;
    }

    // Normale Suche (ohne @ oder #)
    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
    this.searchService.updateSearchQuery(query);
  }

  // ========== USER SELECTED ==========
  selectUser(user: User) {
    if (!user.uid) return;
    
    // Öffne DM mit User
    this.chatContext.openConversation(user.uid);
    
    // Clear search
    this.searchQuery = '';
    this.showUserSuggestions.set(false);
    this.filteredUsers.set([]);
  }

  // ========== CHANNEL SELECTED ==========
  selectChannel(channel: Channel) {
    if (!channel.id) return;
    
    // Öffne Channel
    this.chatContext.openChannel(channel.id);
    
    // Clear search
    this.searchQuery = '';
    this.showChannelSuggestions.set(false);
    this.filteredChannels.set([]);
  }

  // ========== SEARCH FOCUS ==========
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

  // ========== SEARCH BLUR ==========
  onSearchBlur() {
    setTimeout(() => {
      this.isSearchFocused = false;
      this.showUserSuggestions.set(false);
      this.showChannelSuggestions.set(false);
    }, 200);
  }

  // ========== CLEAR SEARCH ==========
  clearSearch() {
    this.searchQuery = '';
    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
    this.filteredUsers.set([]);
    this.filteredChannels.set([]);
    this.searchService.clearSearch();
  }

  // ========== GET AVATAR SRC ==========
  getAvatarSrc(user: User): string {
    if (user.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return '/assets/images/avatars/avatar_default.svg';
  }

  // ========== NEU: Current User Avatar ==========
  getCurrentUserAvatar(): string {
    const user = this.currentUser();
    if (!user) return '/assets/images/avatars/avatar_default.svg';
    return this.getAvatarSrc(user);
  }

  // ========== NEU: Current User Online Status ==========
  getCurrentUserOnlineStatus(): string {
    const user = this.currentUser();
    if (!user) return '/assets/icons/global/Offline.svg';
    return this.userService.getOnlineStatusIcon(user);
  }
  // ========== END NEU ==========

  // ========== PROFILE & DROPDOWN (unverändert) ==========
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
}