import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  OnInit,
  Output,
  EventEmitter,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { AvatarId, getAvatarById } from '../../../../shared/data/avatars';
import { MessageInputService } from '../../../services/message/message-intput.service';
import { UserService } from '../../../services/user.service';
import { NewMessageService } from '../../../services/message/new-message.service';
import { ThreadService } from '../../../services/thread.service';
import { MessageInputMentionService } from '../../../services/message/message-input-mention.service';
import { MessageInputEmojiService } from '../../../services/message/message-input-emoji.service';
import { FormsModule } from '@angular/forms';
import { emojiReactions } from '../../../../shared/data/reactions';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput implements OnInit {

  @Input() channel?: Channel;
  @Input() currentUserUid: string | null = null;
  @Input() contextType: 'channel' | 'conversation' | 'thread' = 'channel';
  @Input() conversationId?: string | null;
  @Input() forceEditable = false;
  @Input() placeholderText?: string;

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

  @Output() editFinished = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<{
    contextType: 'channel' | 'conversation';
    channelId?: string;
    conversationId?: string;
  }>();
  @Output() threadMessageSent = new EventEmitter<{ text: string }>();

  isEditing = false;

  showEmojiPicker = false;
  emojiReactions = emojiReactions;
  private _editingMessage?: { id: string; text: string };
  private newMessage = inject(NewMessageService);
  private threadService = inject(ThreadService);
  private mentionService = inject(MessageInputMentionService);
  private emojiService = inject(MessageInputEmojiService);

  @ViewChild('messageInput') messageInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  public userService = inject(UserService);

  constructor(private messageService: MessageInputService) { }

  users: User[] = [];
  filteredUsers: User[] = [];
  channelsList: Channel[] = [];
  filteredChannels: Channel[] = [];

  activeMentionType: 'user' | 'channel' | null = null;
  showMentions = false;
  mentionPosition = { top: 0, left: 0, bottom: 0 };

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
      this.filterUserMentions(value);
    } else {
      this.filterChannelMentions(value);
    }
  }

  private filterUserMentions(value: string) {
    const result = this.messageService.filterUsersByQuery(this.users, value);
    if (result === null) {
      this.resetMentions();
      this.filteredUsers = [];
      return;
    }
    this.filteredUsers = result;
  }

  private filterChannelMentions(value: string) {
    const result = this.messageService.filterChannelsByQuery(this.channelsList, value);
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

    if (this.isReadOnly) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.onSend();
  }

  async onSend() {
    const text = this.getTrimmedText();
    if (!text) return;
    if (this.contextType === 'thread') {
      this.handleThreadSend(text);
      return;
    }
    if (this.isNewMessageFlow()) {
      await this.handleNewMessageFlow(text);
      return;
    }
    await this.handleNormalSend(text);
  }

  private handleThreadSend(text: string) {
    this.threadMessageSent.emit({ text });
    this.afterSend();
  }

  private isNewMessageFlow(): boolean {
    return this.forceEditable &&
           this.contextType === 'conversation' &&
           !this.conversationId &&
           !this.channel;
  }

  private async handleNewMessageFlow(text: string) {
    const ok = await this.newMessage.sendAndNavigate(text);
    if (ok) this.afterSend();
  }

  private async handleNormalSend(text: string) {
    if (!this.currentUserUid) {
      console.warn('Kein aktueller Benutzer (UID).');
      return;
    }

    try {
      const ctx = await this.sendByContext(text, this.currentUserUid);
      this.afterSend();
      this.messageSent.emit(ctx);
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }
  private getTrimmedText(): string {
    const textarea = this.messageInput?.nativeElement;
    if (!textarea) return '';  // ← NULL-CHECK!
    return textarea.value.trim();
  }

  private async sendByContext(
    text: string,
    senderId: string
  ): Promise<{ contextType: 'channel' | 'conversation'; channelId?: string; conversationId?: string }> {
    if (this.contextType === 'channel') {
      const channelId = await this.handleChannelSend(text, senderId);
      return { contextType: 'channel', channelId };
    } else {
      const conversationId = await this.handleConversationSend(text, senderId);
      return { contextType: 'conversation', conversationId };
    }
  }
  private async handleChannelSend(text: string, senderId: string): Promise<string> {
    if (!this.channel?.id) {
      console.warn('Kein Channel gesetzt.');
      return '';
    }
    const channelId = this.channel.id as string;
    if (this.isEditing && this.editingMessage?.id) {
      await this.messageService.updateChannelMessage(channelId, this.editingMessage.id, text);
    } else {
      await this.messageService.sendChannelMessage(channelId, text, senderId);
    }
    return channelId;
  }
  private async handleConversationSend(text: string, senderId: string): Promise<string> {
    if (!this.conversationId) {
      console.warn('Keine Conversation-ID gesetzt.');
      return '';
    }
    const convId = this.conversationId;
    if (this.isEditing && this.editingMessage?.id) {
      await this.messageService.updateConversationMessage(convId, this.editingMessage.id, text);
    } else {
      await this.messageService.sendConversationMessage(convId, text, senderId);
    }
    return convId;
  }
  private afterSend() {
    const textarea = this.messageInput?.nativeElement;
    if (textarea) {  // ← NULL-CHECK!
      textarea.value = '';
    }
    this.resetMentions();
    this.isEditing = false;
    this._editingMessage = undefined;
    this.editFinished.emit();
  }
  private updateMentionPosition() {
    const textarea = this.messageInput?.nativeElement;
    if (!textarea) return;
    const containerEl = this.container.nativeElement;
    const caretIndex = textarea.selectionStart ?? textarea.value.length;
    const mirror = this.mentionService.createMirror(textarea, caretIndex);
    this.mentionPosition = this.mentionService.calculateMentionPosition(containerEl, mirror);
  }

  getListLabel(user: User): string {
    return this.mentionService.getListLabel(user, this.currentUserUid);
  }

  getMentionLabel(user: User): string {
    return this.mentionService.getMentionLabel(user);
  }

  onSelectUser(user: User) {
    const textarea = this.messageInput?.nativeElement;
    if (!textarea) return;
    this.mentionService.replaceTriggerWithText(textarea, '@', this.getMentionLabel(user));
    this.resetMentions();
  }

  onSelectChannel(channel: Channel) {
    const textarea = this.messageInput?.nativeElement;
    if (!textarea) return;
    this.mentionService.replaceTriggerWithText(textarea, '#', channel.name ?? '');
    this.resetMentions();
  }

  get isChannelMember(): boolean {
    if (this.contextType !== 'channel') return true;

    if (this.channel?.id === 'general') return true;
    if (!this.channel || !this.currentUserUid) return false;

    const members = (this.channel.members ?? []) as string[];
    return members.includes(this.currentUserUid);
  }

  get isReadOnly(): boolean {
    if (this.contextType === 'thread') return false;
    if (this.forceEditable) return false;
    return this.contextType === 'channel' && !this.isChannelMember;
  }

  onAtButtonClick() {
    if (this.isReadOnly) return;

    const textarea = this.messageInput?.nativeElement;  // ← FIX 1
    if (!textarea) return;

    textarea.focus();

    const cursorPos = textarea.selectionStart ?? 0;
    const currentValue = textarea.value;

    const newValue =
      currentValue.slice(0, cursorPos) +
      '@' +
      currentValue.slice(cursorPos);

    textarea.value = newValue;

    const newCursorPos = cursorPos + 1;
    textarea.setSelectionRange(newCursorPos, newCursorPos);

    this.startMention('@');  // ← FIX 2

    console.log('@ eingefügt an Position', cursorPos);
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  onEmojiButtonClick() {
    if (this.isReadOnly) return;
    this.toggleEmojiPicker();
  }

  onEmojiSelect(emoji: string) {
    const textarea = this.messageInput?.nativeElement;
    if (!textarea) return;
    this.emojiService.insertEmojiAtCursor(textarea, emoji);
    this.showEmojiPicker = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showEmojiPicker) return;
    const target = event.target as HTMLElement;
    if (this.emojiService.shouldCloseEmojiPicker(target)) {
      this.showEmojiPicker = false;
    }
  }
}