import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirestoreService } from '../services/firestore';
import { ChannelService } from '../services/channel.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../models/user.model';
import { Channel } from '../models/channel.interface';

/**
 * Unified Search Service
 * Handles both Topbar Dropdown search (@, #) and Workspace Sidebar search
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private firestore = inject(FirestoreService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);

  // ========== TOPBAR DROPDOWN (Signals) ==========
  showUserSuggestions = signal(false);
  showChannelSuggestions = signal(false);
  filteredUsers = signal<User[]>([]);
  filteredChannels = signal<Channel[]>([]);

  // ========== WORKSPACE SIDEBAR (BehaviorSubjects) ==========
  private searchQuerySubject = new BehaviorSubject<string>('');
  public searchQuery$ = this.searchQuerySubject.asObservable();

  private searchActiveSubject = new BehaviorSubject<boolean>(false);
  public searchActive$ = this.searchActiveSubject.asObservable();

  private searchTypeSubject = new BehaviorSubject<'all' | 'channels' | 'users'>('all');
  public searchType$ = this.searchTypeSubject.asObservable();

  // ========== COMPUTED DATA ==========
  allUsers = computed(() => {
    const currentUid = this.auth.uid();
    return this.firestore.userList().filter((u) => u.uid !== currentUid);
  });

  allChannels = computed(() => this.channelService.channels());

  // ==================== TOPBAR METHODS ====================

  /**
   * Handles Topbar search input (@ for users, # for channels)
   */
  handleTopbarSearchInput(query: string): void {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('@')) {
      this.searchTopbarUsers(trimmedQuery);
      return;
    }

    if (trimmedQuery.startsWith('#')) {
      this.searchTopbarChannels(trimmedQuery);
      return;
    }

    this.resetTopbarSuggestions();
  }

  /**
   * Handles Topbar search focus
   */
  handleTopbarSearchFocus(query: string): void {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('@')) {
      this.focusTopbarUserSearch(trimmedQuery);
    } else if (trimmedQuery.startsWith('#')) {
      this.focusTopbarChannelSearch(trimmedQuery);
    }
  }

  /**
   * Clears Topbar search suggestions
   */
  clearTopbarSearch(): void {
    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
    this.filteredUsers.set([]);
    this.filteredChannels.set([]);
  }

  // ========== PRIVATE TOPBAR METHODS ==========

  private searchTopbarUsers(query: string): void {
    this.showUserSuggestions.set(true);
    this.showChannelSuggestions.set(false);

    const searchTerm = query.substring(1).toLowerCase();
    const filtered = this.filterUsersByTerm(searchTerm);
    this.filteredUsers.set(filtered);
  }

  private searchTopbarChannels(query: string): void {
    this.showChannelSuggestions.set(true);
    this.showUserSuggestions.set(false);

    const searchTerm = query.substring(1).toLowerCase();
    const filtered = this.filterChannelsByTerm(searchTerm);
    this.filteredChannels.set(filtered);
  }

  private focusTopbarUserSearch(query: string): void {
    this.showUserSuggestions.set(true);
    const searchTerm = query.substring(1).toLowerCase();
    const filtered = this.filterUsersByTerm(searchTerm);
    this.filteredUsers.set(filtered);
  }

  private focusTopbarChannelSearch(query: string): void {
    this.showChannelSuggestions.set(true);
    const searchTerm = query.substring(1).toLowerCase();
    const filtered = this.filterChannelsByTerm(searchTerm);
    this.filteredChannels.set(filtered);
  }

  private resetTopbarSuggestions(): void {
    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
  }

  // ========== FILTER METHODS (shared by both) ==========

  /**
   * Filters users by search term and excludes users without names
   * Used by both Topbar and Workspace Sidebar
   */
  public filterUsersByTerm(term: string, excludeCurrentUser: boolean = false, currentUserId?: string | null): User[] {
    let users = term.length === 0 
      ? this.allUsers() 
      : this.allUsers().filter(
          (user) =>
            user.displayName?.toLowerCase().includes(term) ||
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term),
        );

        console.log('Before name filter:', users.length);

    // Filter users without names
    users = users.filter(user => user.displayName || user.name);

    console.log('After name filter:', users.length);
    
    // Optionally exclude current user (for workspace sidebar)
    if (excludeCurrentUser && currentUserId) {
      users = users.filter(user => user.uid !== currentUserId);
    }

    return users;
  }

  /**
   * Filters channels by search term
   * Used by both Topbar and Workspace Sidebar
   */
  public filterChannelsByTerm(term: string): Channel[] {
    if (term.length === 0) return this.allChannels();

    return this.allChannels().filter(
      (channel) =>
        channel.name?.toLowerCase().includes(term) ||
        channel.description?.toLowerCase().includes(term),
    );
  }

  // ==================== WORKSPACE SIDEBAR METHODS ====================

  /**
   * Updates search query for Workspace Sidebar
   * Handles @, #, and normal search
   */
  updateSearchQuery(query: string): void {
    let type: 'all' | 'channels' | 'users' = 'all';
    let cleanQuery = query;

    if (query.startsWith('#')) {
      type = 'channels';
      cleanQuery = query.slice(1);
    } else if (query.startsWith('@')) {
      type = 'users';
      cleanQuery = query.slice(1);
    }

    this.searchTypeSubject.next(type);
    this.searchQuerySubject.next(cleanQuery);
    this.searchActiveSubject.next(query.trim().length > 0);
  }

  /**
   * Clears Workspace Sidebar search
   */
  clearSearch(): void {
    this.searchQuerySubject.next('');
    this.searchActiveSubject.next(false);
    this.searchTypeSubject.next('all');
  }

  /**
   * Checks if Workspace Sidebar search is active
   */
  isSearchActive(): boolean {
    return this.searchActiveSubject.value;
  }

  /**
   * Gets current search type for Workspace Sidebar
   */
  getSearchType(): 'all' | 'channels' | 'users' {
    return this.searchTypeSubject.value;
  }
}