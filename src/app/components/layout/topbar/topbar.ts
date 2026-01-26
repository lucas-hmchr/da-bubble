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
import { TopbarSearchService } from './services/topbar-search.service';
import { ProfileHandlerService } from './services/profile.topbar.service';
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
  public topbarSearch = inject(TopbarSearchService);
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

  showUserSuggestions = computed(() => this.topbarSearch.showUserSuggestions());
  showChannelSuggestions = computed(() => this.topbarSearch.showChannelSuggestions());
  filteredUsers = computed(() => this.topbarSearch.filteredUsers());
  filteredChannels = computed(() => this.topbarSearch.filteredChannels());

  currentUser = computed(() => {
    const uid = this.auth.uid();
    if (!uid) return null;
    return this.firestore.userList().find((u) => u.uid === uid) || null;
  });

/**
 * Constructor.
 *
 * Observes the breakpoint '(max-width: 375px)' to detect
 * whether the screen width is less than 375px. If so,
 * sets the MobileProfil property to true.
 *
 * Also listens to the window resize event to update the
 * MobileProfil property accordingly.
 */
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

/**
 * Initializes the component.
 *
 * Adds an event listener to the document to detect when
 * a click event occurs outside of the component. When such
 * an event occurs, sets the isDropdownMenuOpen property to
 * false, effectively closing the dropdown menu.
 */
  ngOnInit() {
    document.addEventListener('click', () => {
      this.isDropdownMenuOpen = false;
    });
  }

/**
 * Called when the component is destroyed.
 * Notifies the destroy subject and completes it to
 * prevent memory leaks.
 * */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

/**
 * Handles a search input query by passing the query to the TopbarSearchService.
 *
 * If the query does not start with '@' or '#', updates the search query in the SearchService.
 */
  onSearchInput() {
    this.topbarSearch.handleSearchInput(this.searchQuery);
    if (!this.searchQuery.startsWith('@') && !this.searchQuery.startsWith('#')) {
      this.searchService.updateSearchQuery(this.searchQuery.trim());
    }
  }

/**
 * Sets the isSearchFocused property to true and passes the current search query to the TopbarSearchService.
 * This method should be called when the search input is focused.
 */
  onSearchFocus() {
    this.isSearchFocused = true;
    this.topbarSearch.handleSearchFocus(this.searchQuery);
  }

/**
 * Called when the search input is blurred.
 * Sets the isSearchFocused property to false and clears the search query after a delay of 200ms.
 * This method should be called when the search input is blurred.
 */
  onSearchBlur() {
    setTimeout(() => {
      this.isSearchFocused = false;
      this.topbarSearch.clearSearch();
    }, 200);
  }

/**
 * Clears the search query and resets the search suggestions.
 *
 * Sets the search query to an empty string and calls the clearSearch methods of the TopbarSearchService and SearchService.
 */

  clearSearch() {
    this.searchQuery = '';
    this.topbarSearch.clearSearch();
    this.searchService.clearSearch();
  }

/**
 * Opens a conversation with the given user and clears the search query.
 *
 * @param user The user to open a conversation with.
 */
  selectUser(user: User) {
    if (!user.uid) return;
    this.chatContext.openConversation(user.uid);
    this.clearSearch();
  }

/**
 * Opens a channel with the given id and clears the search query.
 * @param channel The channel to open.
 */
  selectChannel(channel: Channel) {
    if (!channel.id) return;
    this.chatContext.openChannel(channel.id);
    this.clearSearch();
  }

/**
 * Saves a new profile name to the database.
 * @returns A Promise resolving to a boolean indicating whether the save was successful or not.
 * If the save was successful, the modal will be closed and a success message will be logged to the console.
 * If the save was not successful, an alert will be shown with the error message.
 */
  async saveProfileName() {
    const user = this.currentUser();
    const result = await this.profileHandler.saveProfileName(
      this.editNameValue,
      user?.uid || null
    );

    if (result.success) {
      this.closeProfilEditModal();
      console.log(result.message);
    } else {
      alert(result.message);
    }
  }

/**
 * Returns the avatar image source of a given user.
 * If the user has a valid avatarId, the source of the avatar image
 * is returned. Otherwise, the default avatar image source is returned.
 * @param user The user for which to retrieve the avatar image source.
 * @returns The avatar image source of the given user.
 */
  getAvatarSrc(user: User): string {
    if (user.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return '/assets/images/avatars/avatar_default.svg';
  }

/**
 * Returns the avatar image source of the current user.
 *
 * If the current user is not set, the default avatar image source is returned.
 * Otherwise, the avatar image source of the current user is returned.
 *
 * @returns The avatar image source of the current user.
 */
  getCurrentUserAvatar(): string {
    const user = this.currentUser();
    if (!user) return '/assets/images/avatars/avatar_default.svg';
    return this.getAvatarSrc(user);
  }

/**
 * Returns the online status icon of the current user.
 * If the current user is not set, returns the offline icon.
 * Otherwise, returns the online status icon of the current user.
 * @returns The online status icon of the current user.
 */
  getCurrentUserOnlineStatus(): string {
    const user = this.currentUser();
    if (!user) return '/assets/icons/global/Offline.svg';
    return this.userService.getOnlineStatusIcon(user);
  }

/**
 * Toggles the dropdown menu open/closed state.
 * When called, it first stops the propagation of the event.
 * Then, it toggles the isDropdownMenuOpen property, effectively
 * opening or closing the dropdown menu.
 * @param event The event that triggered this function call.
 */
  toggleDropdownMenu(event: Event) {
    event.stopPropagation();
    this.isDropdownMenuOpen = !this.isDropdownMenuOpen;
  }

  @HostListener('document:click')
/**
 * Closes the dropdown menu.
 * Sets the isDropdownMenuOpen property to false, effectively
 * closing the dropdown menu.
 */
  closeDropdown() {
    this.isDropdownMenuOpen = false;
  }

/**
 * Opens the profil modal.
 * Sets the activeProfilName to 'profil', effectively opening the profil modal.
 * Sets the isProfilModalOpen property to true, effectively opening the modal.
 * If MobileProfil is false, sets the isDropdownMenuOpen property to false, effectively closing the dropdown menu.
 * Sets the document body's overflow style to 'hidden', effectively hiding the scrollbars.
 */
  openProfilModal() {
    this.activeProfilName = 'profil';
    this.isProfilModalOpen = true;
    if (!this.MobileProfil) {
      this.isDropdownMenuOpen = false;
    }
    document.body.style.overflow = 'hidden';
  }

/**
 * Opens the profile edit modal.
 * Sets the editNameValue to the current user's displayName or name, or an empty string if neither is available.
 * Sets the isProfilEditModalOpen property to true, effectively opening the modal.
 * Sets the isProfilModalOpen property to false, effectively closing the profile modal.
 * Sets the document body's overflow style to 'hidden', effectively hiding the scrollbars.
 * */
  openProfilEditModal() {
    const user = this.currentUser();
    this.editNameValue = user?.displayName || user?.name || '';
    this.isProfilEditModalOpen = true;
    this.isProfilModalOpen = false;
    document.body.style.overflow = 'hidden';
  }

/**
 * Closes the profile modal without affecting the dropdown menu.
 * Sets the activeProfilName property to null, effectively closing the profile modal.
 * Sets the isProfilModalOpen property to false, effectively closing the modal.
 * Sets the isDropdownMenuOpen property to false, effectively closing the dropdown menu.
 * Sets the document body's overflow style to an empty string, effectively showing the scrollbars.
 */
  closeProfilModalOnly() {
    this.activeProfilName = null;
    this.isProfilModalOpen = false;
    this.isDropdownMenuOpen = false;
    document.body.style.overflow = '';
  }

/**
 * Closes the profile edit modal without affecting the profile modal or dropdown menu.
 * Sets the isProfilEditModalOpen property to false, effectively closing the modal.
 * Sets the document body's overflow style to an empty string, effectively showing the scrollbars.
 */
  closeProfilEditModalOnly() {
    this.isProfilEditModalOpen = false;
    document.body.style.overflow = '';
  }

/**
 * Closes the profile modal, profile edit modal and dropdown menu.
 * Sets the activeProfilName property to null, effectively closing the profile modal.
 * Sets the isProfilModalOpen and isProfilEditModalOpen properties to false, effectively closing the modal.
 * Sets the isDropdownMenuOpen property to false, effectively closing the dropdown menu.
 * Sets the document body's overflow style to an empty string, effectively showing the scrollbars.
 */
  closeProfilModal() {
    this.activeProfilName = null;
    this.isProfilModalOpen = false;
    this.isDropdownMenuOpen = false;
    document.body.style.overflow = '';
  }

/**
 * Closes the profile edit modal, profile modal and dropdown menu.
 * Sets the activeProfilName property to null, effectively closing the profile modal.
 * Sets the isProfilEditModalOpen property to false, effectively closing the modal.
 * Sets the document body's overflow style to an empty string, effectively showing the scrollbars.
 */
  closeProfilEditModal() {
    this.activeProfilName = null;
    this.isProfilEditModalOpen = false;
    document.body.style.overflow = '';
  }

/**
 * Logs the user out of the application.
 * Prevents the event from propagating further up the DOM tree.
 * Sets the isDropdownMenuOpen property to false, effectively closing the dropdown menu.
 * Calls the logout method of the AuthService, effectively logging the user out.
 */
  async onLogout(event: Event) {
    event.stopPropagation();
    this.isDropdownMenuOpen = false;
    await this.auth.logout();
  }
}