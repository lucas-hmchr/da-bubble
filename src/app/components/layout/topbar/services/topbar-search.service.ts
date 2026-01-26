import { Injectable, signal, computed, inject } from '@angular/core';
import { FirestoreService } from '../../../../services/firestore';
import { ChannelService } from '../../../../services/channel.service';
import { AuthService } from '../../../../auth/auth.service';
import { User } from '../../../../models/user.model';
import { Channel } from '../../../../models/channel.interface';

@Injectable({ providedIn: 'root' })
export class TopbarSearchService {
  private firestore = inject(FirestoreService);
  private channelService = inject(ChannelService);
  private auth = inject(AuthService);

  showUserSuggestions = signal(false);
  showChannelSuggestions = signal(false);
  filteredUsers = signal<User[]>([]);
  filteredChannels = signal<Channel[]>([]);

  allUsers = computed(() => {
    const currentUid = this.auth.uid();
    return this.firestore.userList().filter((u) => u.uid !== currentUid);
  });

  allChannels = computed(() => this.channelService.channels());

  /**
   * Handles a search input query.
   *
   * If the query starts with '@', it will search for users.
   * If the query starts with '#', it will search for channels.
   * If the query is empty or does not start with '@' or '#', it will reset the suggestions.
   *
   * @param query The search query.
   */
  handleSearchInput(query: string): void {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('@')) {
      this.searchUsers(trimmedQuery);
      return;
    }

    if (trimmedQuery.startsWith('#')) {
      this.searchChannels(trimmedQuery);
      return;
    }

    this.resetSuggestions();
  }

  /**
   * Searches for users based on the provided query.
   *
   * The query should start with '@'. The remaining characters will be used to search for users.
   *
   * @param query The search query.
   */
  private searchUsers(query: string): void {
    this.showUserSuggestions.set(true);
    this.showChannelSuggestions.set(false);

    const searchTerm = query.substring(1).toLowerCase();
    const filtered = this.filterUsersByTerm(searchTerm);
    this.filteredUsers.set(filtered);
  }

  /**
   * Searches for channels based on the provided query.
   *
   * The query should start with '#'. The remaining characters will be used to search for channels.
   *
   * @param query The search query.
   */
  private searchChannels(query: string): void {
    this.showChannelSuggestions.set(true);
    this.showUserSuggestions.set(false);

    const searchTerm = query.substring(1).toLowerCase();
    const filtered = this.filterChannelsByTerm(searchTerm);
    this.filteredChannels.set(filtered);
  }

  /**
   * Filters the list of all users based on the provided term.
   * If the term is empty, returns the list of all users.
   * @param term The term to filter the users by.
   * @returns The filtered list of users.
   */
  private filterUsersByTerm(term: string): User[] {
    if (term.length === 0) return this.allUsers();

    return this.allUsers().filter(
      (user) =>
        user.displayName?.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term),
    );
  }

  /**
   * Filters the list of all channels based on the provided term.
   * If the term is empty, returns the list of all channels.
   * @param term The term to filter the channels by.
   * @returns The filtered list of channels.
   */
  private filterChannelsByTerm(term: string): Channel[] {
    if (term.length === 0) return this.allChannels();

    return this.allChannels().filter(
      (channel) =>
        channel.name?.toLowerCase().includes(term) ||
        channel.description?.toLowerCase().includes(term),
    );
  }

  /**
   * Handles a search input query by focusing on either user or channel search based on the query's prefix.
   * If the query starts with '@', it will focus on user search.
   * If the query starts with '#', it will focus on channel search.
   * If the query is empty or does not start with '@' or '#', it will reset the search suggestions.
   * @param query The search query.
   */
  handleSearchFocus(query: string): void {
    const trimmedQuery = query.trim();

    if (trimmedQuery.startsWith('@')) {
      this.focusUserSearch(trimmedQuery);
    } else if (trimmedQuery.startsWith('#')) {
      this.focusChannelSearch(trimmedQuery);
    }
  }

  /**
   * Focuses the search on users by setting showUserSuggestions to true and updating the filteredUsers with the result of filterUsersByTerm.
   * @param query The search query to filter users by. The query should start with '@', otherwise the search will not be focused on users.
   */
  private focusUserSearch(query: string): void {
    this.showUserSuggestions.set(true);
    const searchTerm = query.substring(1).toLowerCase();
    const filtered = this.filterUsersByTerm(searchTerm);
    this.filteredUsers.set(filtered);
  }

  /**
   * Focuses the search on channels by setting showChannelSuggestions to true and updating the filteredChannels with the result of filterChannelsByTerm.
   * @param query The search query to filter channels by. The query should start with '#', otherwise the search will not be focused on channels.
   * */
  private focusChannelSearch(query: string): void {
    this.showChannelSuggestions.set(true);
    const searchTerm = query.substring(1).toLowerCase();
    const filtered = this.filterChannelsByTerm(searchTerm);
    this.filteredChannels.set(filtered);
  }

/**
 * Resets the search suggestions by setting showUserSuggestions and showChannelSuggestions to false and clearing the filteredUsers and filteredChannels lists.
 */
  clearSearch(): void {
    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
    this.filteredUsers.set([]);
    this.filteredChannels.set([]);
  }

/**
 * Resets the search suggestions by setting showUserSuggestions and showChannelSuggestions to false.
 * This method is used to clear the search suggestions when the search input is cleared or when the search is focused on a different type (i.e. user or channel).
 */
  private resetSuggestions(): void {
    this.showUserSuggestions.set(false);
    this.showChannelSuggestions.set(false);
  }
}