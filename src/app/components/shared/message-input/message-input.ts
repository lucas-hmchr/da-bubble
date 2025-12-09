import { Component, Input, ElementRef, ViewChild, OnInit, Output, EventEmitter, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { AvatarId, getAvatarById } from '../../../../shared/data/avatars';
import { MessageInputService } from '../../../services/message-intput.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput implements OnInit {
  @Input() channel?: Channel;
  @Input() currentUserUid: string | null = null;
  @Input() contextType: 'channel' | 'conversation' = 'channel';
  @Input() conversationId?: string;

  @Output() editFinished = new EventEmitter<void>();

  isEditing = false;

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  public userService = inject(UserService)

  users: User[] = [];
  filteredUsers: User[] = [];
  channelsList: Channel[] = [];
  filteredChannels: Channel[] = [];

  activeMentionType: 'user' | 'channel' | null = null;
  showMentions = false;
  mentionPosition = { top: 0, left: 0, bottom: 0 };

  constructor(private messageService: MessageInputService) { }

  ngOnInit(): void {
    this.messageService.loadUsers().subscribe((users) => {
      this.users = users;
      this.filteredUsers = users;
    });

    this.messageService.loadChannels().subscribe((channels) => {
      this.channelsList = channels;
      this.filteredChannels = channels;
    });
  }

  getAvatarSrc(id: AvatarId) {
    return getAvatarById(id).src;
  }

  onKeyup(event: KeyboardEvent | Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    const lastChar = value.slice(-1);

    if (lastChar === '@' || lastChar === '#') {
      this.startMention(lastChar);
      return;
    }

    if (!this.showMentions || !this.activeMentionType) return;

    this.updateMentionPosition();
    this.filterMentions(value);
  }

  private startMention(trigger: string) {
    this.showMentions = true;
    this.activeMentionType = trigger === '@' ? 'user' : 'channel';

    if (this.activeMentionType === 'user') {
      this.filteredUsers = this.users;
    } else {
      this.filteredChannels = this.channelsList;
    }

    this.updateMentionPosition();
  }

  private filterMentions(value: string) {
    if (this.activeMentionType === 'user') {
      const result = this.messageService.filterUsersByQuery(
        this.users,
        value
      );

      if (result === null) {
        this.resetMentions();
        this.filteredUsers = [];
        return;
      }

      this.filteredUsers = result;
      return;
    }

    const result = this.messageService.filterChannelsByQuery(
      this.channelsList,
      value
    );

    if (result === null) {
      this.resetMentions();
      this.filteredChannels = [];
      return;
    }

    this.filteredChannels = result;
  }

  private resetMentions() {
    this.showMentions = false;
    this.activeMentionType = null;
  }

  onEnter(event: KeyboardEvent | Event) {
    if ((event as KeyboardEvent).shiftKey) return;

    // wenn kein Member, Enter komplett ignorieren
    if (this.contextType === 'channel' && !this.isChannelMember) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.onSend();
  }


  async onSend() {
    const text = this.getTrimmedText();
    if (!text) return;

    if (!this.currentUserUid) {
      console.warn('Kein aktueller Benutzer (UID).');
      return;
    }

    // 🚫 Nicht senden, wenn kein Channel-Member
    if (this.contextType === 'channel' && !this.isChannelMember) {
      console.warn('Du bist kein Mitglied dieses Channels – Nachricht wird nicht gesendet.');
      return;
    }

    try {
      await this.sendByContext(text, this.currentUserUid);
      this.afterSend();
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }



  private getTrimmedText(): string {
    const textarea = this.messageInput.nativeElement;
    return textarea.value.trim();
  }

  private async sendByContext(text: string, senderId: string) {
    if (this.contextType === 'channel') {
      await this.handleChannelSend(text, senderId);
      return;
    }

    await this.handleConversationSend(text, senderId);
  }


  private afterSend() {
    this.messageInput.nativeElement.value = '';
    this.resetMentions();
    this.isEditing = false;
    this._editingMessage = undefined;
    this.editFinished.emit();
  }


  private updateMentionPosition() {
    const textarea = this.messageInput.nativeElement;
    const containerEl = this.container.nativeElement;
    const caretIndex = textarea.selectionStart ?? textarea.value.length;

    const mirror = this.createMirror(textarea, caretIndex);
    containerEl.appendChild(mirror);

    const marker = mirror.lastElementChild as HTMLElement;
    const markerRect = marker.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    this.mentionPosition = {
      top: markerRect.bottom - containerRect.top + 8,
      left: markerRect.left - containerRect.left,
      bottom: containerRect.bottom - markerRect.top + 8,
    };

    containerEl.removeChild(mirror);
  }

  private createMirror(textarea: HTMLTextAreaElement, caretIndex: number): HTMLDivElement {
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);

    Array.from(style).forEach((name) => {
      mirror.style.setProperty(name, style.getPropertyValue(name));
    });

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.overflow = 'hidden';
    mirror.style.top = textarea.offsetTop + 'px';
    mirror.style.left = textarea.offsetLeft + 'px';
    mirror.style.width = textarea.clientWidth + 'px';

    mirror.textContent = textarea.value.substring(0, caretIndex);

    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.appendChild(marker);

    return mirror;
  }

  getListLabel(user: User): string {
    const baseName = user.displayName ?? user.name ?? '';

    if (this.currentUserUid && user.uid === this.currentUserUid) {
      return `${baseName} (Du)`;
    }

    return baseName;
  }

  getMentionLabel(user: User): string {
    return user.displayName ?? user.name ?? '';
  }

  onSelectUser(user: User) {
    this.replaceTriggerWithText('@', this.getMentionLabel(user));
    this.resetMentions();
  }

  onSelectChannel(channel: Channel) {
    this.replaceTriggerWithText('#', channel.name ?? '');
    this.resetMentions();
  }

  private replaceTriggerWithText(trigger: string, text: string) {
    const textarea = this.messageInput.nativeElement;
    const value = textarea.value;
    const lastIndex = value.lastIndexOf(trigger);

    if (lastIndex === -1) return;

    const before = value.slice(0, lastIndex);
    textarea.value = `${before}${trigger}${text} `;
    textarea.focus();
  }

  private _editingMessage?: { id: string; text: string };

  @Input() set editingMessage(value: { id: string; text: string } | undefined) {
    this._editingMessage = value;
    this.isEditing = !!value;

    if (value && this.messageInput) {
      this.messageInput.nativeElement.value = value.text;
    }
  }

  get editingMessage() {
    return this._editingMessage;
  }

  private async handleChannelSend(text: string, senderId: string) {
    if (!this.channel?.id) {
      console.warn('Kein Channel gesetzt.');
      return;
    }

    const channelId = this.channel.id as string;

    if (this.isEditing && this.editingMessage?.id) {
      await this.messageService.updateChannelMessage(
        channelId,
        this.editingMessage.id,
        text
      );
      return;
    }

    await this.messageService.sendChannelMessage(channelId, text, senderId);
  }

  private async handleConversationSend(text: string, senderId: string) {
    if (!this.conversationId) {
      console.warn('Keine Conversation-ID gesetzt.');
      return;
    }

    const convId = this.conversationId;

    if (this.isEditing && this.editingMessage?.id) {
      await this.messageService.updateConversationMessage(
        convId,
        this.editingMessage.id,
        text
      );
      return;
    }

    await this.messageService.sendConversationMessage(convId, text, senderId);
  }


  get isChannelMember(): boolean {
    if (this.contextType !== 'channel') return true;
    if (!this.channel || !this.currentUserUid) return false;
    const members = this.channel.members ?? [];
    return members.includes(this.currentUserUid);
  }

  get isReadOnly(): boolean {
    return this.contextType === 'channel' && !this.isChannelMember;
  }



}
