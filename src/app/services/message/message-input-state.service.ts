import { Injectable, signal } from '@angular/core';
import { Channel } from '../../models/channel.interface';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class MessageInputStateService {
  
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  channelsList = signal<Channel[]>([]);
  filteredChannels = signal<Channel[]>([]);
  
  activeMentionType = signal<'user' | 'channel' | null>(null);
  showMentions = signal<boolean>(false);
  mentionPosition = signal({ top: 0, left: 0, bottom: 0 });
  selectedMentionIndex = signal<number>(0);
  
  showEmojiPicker = signal<boolean>(false);

  setUsers(users: User[]): void {
    this.users.set(users);
    this.filteredUsers.set(users);
  }

  setChannels(channels: Channel[]): void {
    this.channelsList.set(channels);
    this.filteredChannels.set(channels);
  }

  setFilteredUsers(users: User[]): void {
    this.filteredUsers.set(users);
  }

  setFilteredChannels(channels: Channel[]): void {
    this.filteredChannels.set(channels);
  }

  startMention(type: 'user' | 'channel'): void {
    this.showMentions.set(true);
    this.activeMentionType.set(type);
    this.selectedMentionIndex.set(0);

    if (type === 'user') {
      this.filteredUsers.set(this.users());
    } else {
      this.filteredChannels.set(this.channelsList());
    }
  }

  resetMentions(): void {
    this.showMentions.set(false);
    this.activeMentionType.set(null);
  }

  setMentionPosition(position: { top: number; left: number; bottom: number }): void {
    this.mentionPosition.set(position);
  }

  incrementSelectedIndex(maxLength: number): void {
    const current = this.selectedMentionIndex();
    this.selectedMentionIndex.set(Math.min(current + 1, maxLength - 1));
  }

  decrementSelectedIndex(): void {
    const current = this.selectedMentionIndex();
    this.selectedMentionIndex.set(Math.max(current - 1, 0));
  }

  resetSelectedIndex(): void {
    this.selectedMentionIndex.set(0);
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker.update(value => !value);
  }

  closeEmojiPicker(): void {
    this.showEmojiPicker.set(false);
  }

  isChannelMember(
    contextType: string,
    channel: Channel | undefined,
    currentUserUid: string | null
  ): boolean {
    if (contextType !== 'channel') return true;
    if (channel?.id === 'general') return true;
    if (!channel || !currentUserUid) return false;
    const members = (channel.members ?? []) as string[];
    return members.includes(currentUserUid);
  }

  isReadOnly(
    contextType: string,
    forceEditable: boolean,
    isChannelMember: boolean
  ): boolean {
    if (contextType === 'thread') return false;
    if (forceEditable) return false;
    return contextType === 'channel' && !isChannelMember;
  }
}