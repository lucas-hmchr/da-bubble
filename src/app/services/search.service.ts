import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FirestoreService } from '../services/firestore';
import { ChannelService } from '../services/channel.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../models/user.model';
import { Channel } from '../models/channel.interface';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private firestore = inject(FirestoreService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);

  showUserSuggestions = signal(false);
  showChannelSuggestions = signal(false);
  filteredUsers = signal<User[]>([]);
  filteredChannels = signal<Channel[]>([]);

  private searchQuerySubject = new BehaviorSubject<string>('');
  public searchQuery$ = this.searchQuerySubject.asObservable();

  private searchActiveSubject = new BehaviorSubject<boolean>(false);
  public searchActive$ = this.searchActiveSubject.asObservable();

  private searchTypeSubject = new BehaviorSubject<'all' | 'channels' | 'users'>('all');
  public searchType$ = this.searchTypeSubject.asObservable();

  allUsers = computed(() => {
    const currentUid = this.auth.uid();
    return this.firestore.userList().filter((u) => u.uid !== currentUid);
  });

  allChannels = computed(() => this.channelService.channels());


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

  handleTopbarSearchFocus(query: string): void {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('@')) {
      this.focusTopbarUserSearch(trimmedQuery);
    } else if (trimmedQuery.startsWith('#')) {
      this.focusTopbarChannelSearch(trimmedQuery);
    }
  }

  clearTopbarSearch(): void {
    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
    this.filteredUsers.set([]);
    this.filteredChannels.set([]);
  }


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


  public filterUsersByTerm(term: string, excludeCurrentUser: boolean = false, currentUserId?: string | null): User[] {
    let users = term.length === 0
      ? this.allUsers()
      : this.allUsers().filter(
        (user) =>
          user.displayName?.toLowerCase().includes(term) ||
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term),
      );

    users = users.filter(user => user.displayName || user.name);

    if (excludeCurrentUser && currentUserId) {
      users = users.filter(user => user.uid !== currentUserId);
    }

    return users;
  }

  public filterChannelsByTerm(term: string): Channel[] {
    if (term.length === 0) return this.allChannels();

    return this.allChannels().filter(
      (channel) =>
        channel.name?.toLowerCase().includes(term) ||
        channel.description?.toLowerCase().includes(term),
    );
  }


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

  clearSearch(): void {
    this.searchQuerySubject.next('');
    this.searchActiveSubject.next(false);
    this.searchTypeSubject.next('all');
  }

  isSearchActive(): boolean {
    return this.searchActiveSubject.value;
  }

  getSearchType(): 'all' | 'channels' | 'users' {
    return this.searchTypeSubject.value;
  }
}