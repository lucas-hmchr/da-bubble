import { Injectable } from '@angular/core';
import { User } from '../../models/user.model';
import { Channel } from '../../models/channel.interface';
import { MessageInputService } from './message-intput.service';
import { MessageInputStateService } from './message-input-state.service';

@Injectable({ providedIn: 'root' })
export class MessageInputMentionDropdownService {
  constructor(
    private messageInputService: MessageInputService,
    private state: MessageInputStateService,
  ) {}

  handleKeyup(value: string): void {
    const atMatch = value.match(/@(\w*)$/);
    const hashMatch = value.match(/#(\w*)$/);

    if (atMatch) {
      if (!this.state.showMentions() || this.state.activeMentionType() !== 'user') {
        this.state.startMention('user');
      }
      this.filterMentions(value);
      return;
    }

    if (hashMatch) {
      if (!this.state.showMentions() || this.state.activeMentionType() !== 'channel') {
        this.state.startMention('channel');
      }
      this.filterMentions(value);
      return;
    }

    if (this.state.showMentions()) {
      this.state.resetMentions();
    }
  }

  private filterMentions(value: string): void {
    this.state.resetSelectedIndex();
    if (this.state.activeMentionType() === 'user') {
      this.filterUserMentions(value);
    } else {
      this.filterChannelMentions(value);
    }
  }

  private filterUserMentions(value: string): void {
    const result = this.messageInputService.filterUsersByQuery(this.state.users(), value);
    
    // Wenn result null ist UND Query leer, zeige alle User
    const atMatch = value.match(/@(\w*)$/);
    const query = atMatch ? atMatch[1] : '';
    
    if (result === null && query === '') {
      this.state.setFilteredUsers(this.state.users());
      return;
    }
    
    if (result === null || result.length === 0) {
      this.state.resetMentions();
      this.state.setFilteredUsers([]);
      return;
    }
    
    this.state.setFilteredUsers(result);
  }

  private filterChannelMentions(value: string): void {
    const result = this.messageInputService.filterChannelsByQuery(this.state.channelsList(), value);
    
    // Wenn result null ist UND Query leer, zeige alle Channels
    const hashMatch = value.match(/#(\w*)$/);
    const query = hashMatch ? hashMatch[1] : '';
    
    if (result === null && query === '') {
      this.state.setFilteredChannels(this.state.channelsList());
      return;
    }
    
    if (result === null || result.length === 0) {
      this.state.resetMentions();
      this.state.setFilteredChannels([]);
      return;
    }
    
    this.state.setFilteredChannels(result);
  }

  handleKeyboardNavigation(event: KeyboardEvent): boolean {
    const items = this.getCurrentItems();

    if (event.key === 'ArrowDown') {
      this.state.incrementSelectedIndex(items.length);
      this.scrollToSelected();
      return true;
    }

    if (event.key === 'ArrowUp') {
      this.state.decrementSelectedIndex();
      this.scrollToSelected();
      return true;
    }

    if (event.key === 'Escape') {
      this.state.resetMentions();
      return true;
    }

    return false;
  }

  getCurrentItems(): (User | Channel)[] {
    return this.state.activeMentionType() === 'user'
      ? this.state.filteredUsers()
      : this.state.filteredChannels();
  }

  getSelectedItem(): User | Channel | null {
    const items = this.getCurrentItems();
    const index = this.state.selectedMentionIndex();
    return items[index] || null;
  }

  private scrollToSelected(): void {
    setTimeout(() => {
      const dropdown = document.querySelector('.mention-dropdown');
      if (!dropdown) return;
      const selectedItem = dropdown.querySelector('.mention-item.selected') as HTMLElement;
      if (!selectedItem) return;
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 0);
  }
}