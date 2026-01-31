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
import { SearchService } from '../../../services/search.service';
import { ProfileHandlerService } from '../../../services/profile-topbar.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { ChannelService } from '../../../services/channel.service';
import { UserService } from '../../../services/user.service';
import { ChatContextService } from '../../../services/chat-context.service';
import { User } from '../../../models/user.model';
import { Channel } from '../../../models/channel.interface';
import { MessageSearchResult } from '../../../services/search.service';
import { getAvatarById } from '../../../../shared/data/avatars';
import { Subject } from 'rxjs';

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
  private profileHandler = inject(ProfileHandlerService);
  public userService = inject(UserService);
  private searchService = inject(SearchService);
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

  showUserSuggestions = computed(() => this.searchService.showUserSuggestions());
  showChannelSuggestions = computed(() => this.searchService.showChannelSuggestions());
  showFullTextSearch = computed(() => this.searchService.showFullTextSearch());
  filteredUsers = computed(() => this.searchService.filteredUsers());
  filteredChannels = computed(() => this.searchService.filteredChannels());
  filteredMessages = computed(() => this.searchService.filteredMessages());

  currentUser = computed(() => {
    const uid = this.auth.uid();
    if (!uid) return null;
    return this.firestore.userList().find((u) => u.uid === uid) || null;
  });

  constructor(
    private auth: AuthService,
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
    this.searchService.handleTopbarSearchInput(this.searchQuery);
    if (!this.searchQuery.startsWith('@') && !this.searchQuery.startsWith('#')) {
      this.searchService.updateSearchQuery(this.searchQuery.trim());
    }
  }

  onSearchFocus() {
    this.isSearchFocused = true;
    this.searchService.handleTopbarSearchFocus(this.searchQuery);
  }

  onSearchBlur() {
    setTimeout(() => {
      this.isSearchFocused = false;
      this.searchService.clearTopbarSearch();
    }, 200);
  }


  clearSearch() {
    this.searchQuery = '';
    this.searchService.clearTopbarSearch();
    this.searchService.clearSearch();
  }

  selectUser(user: User) {
    if (!user.uid) return;
    this.chatContext.openConversation(user.uid);
    this.clearSearch();
  }

  selectChannel(channel: Channel) {
    if (!channel.id) return;
    this.chatContext.openChannel(channel.id);
    this.clearSearch();
  }

  async saveProfileName() {
    const user = this.currentUser();
    const result = await this.profileHandler.saveProfileName(
      this.editNameValue,
      user?.uid || null
    );

    if (result.success) {
      this.closeProfilEditModal();
    } else {
      alert(result.message);
    }
  }

  getAvatarSrc(user: User): string {
    if (user.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return 'assets/images/avatars/avatar_default.svg';
  }

  getCurrentUserAvatar(): string {
    const user = this.currentUser();
    if (!user) return 'assets/images/avatars/avatar_default.svg';
    return this.getAvatarSrc(user);
  }

  getCurrentUserOnlineStatus(): string {
    const user = this.currentUser();
    if (!user) return 'assets/icons/global/Offline.svg';
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

  async onLogout(event: Event) {
    event.stopPropagation();
    this.isDropdownMenuOpen = false;
    await this.auth.logout();
  }

  // ========== FULLTEXT SEARCH METHODS ==========

  getTotalResultCount(): number {
    return this.filteredChannels().length + 
           this.filteredUsers().length + 
           this.filteredMessages().length;
  }

  getMessageSnippet(text: string, maxLength: number = 80): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getAvatarSrcById(userId: string): string {
    const user = this.firestore.userList().find(u => u.uid === userId);
    if (!user) return '/assets/images/avatars/avatar_default.svg';
    return this.getAvatarSrc(user);
  }

  selectMessage(msg: MessageSearchResult): void {
    if (msg.contextType === 'channel') {
      this.chatContext.openChannel(msg.contextId);
    } else {
      this.chatContext.openConversation(msg.senderId);
    }
    
    // Scroll to message after context is loaded
    setTimeout(() => {
      this.scrollToMessage(msg.id);
    }, 500);
    
    this.clearSearch();
  }

  private scrollToMessage(messageId: string): void {
    const element = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight effect
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 2000);
    }
  }
}