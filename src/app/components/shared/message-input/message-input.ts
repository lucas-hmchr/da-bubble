import { Component, Input, ElementRef, ViewChild, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, inject, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { AvatarId, getAvatarById } from '../../../../shared/data/avatars';
import { MessageInputService } from '../../../services/message/message-intput.service';
import { UserService } from '../../../services/user.service';
import { NewMessageService } from '../../../services/message/new-message.service';
import { ThreadService } from '../../../services/thread.service';
import { MessageInputMentionService } from '../../../services/message/message-input-mention.service';
import { MessageInputEmojiService } from '../../../services/message/message-input-emoji.service';
import { MessageInputCaretService } from '../../../services/message/message-input-caret.service';
import { MessageInputValidationService } from '../../../services/message/message-input-validation.service';
import { MessageInputSendService } from '../../../services/message/message-input-send.service';
import { MessageInputStateService } from '../../../services/message/message-input-state.service';
import { MessageInputMentionDropdownService } from '../../../services/message/message-input-mention-dropdown.service';
import { emojiReactions } from '../../../../shared/data/reactions';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput implements OnInit, OnChanges {
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
      this.messageInput.nativeElement.innerHTML = this.validationService.escapeHtml(value.text);
    }
  }

  isHoveringEmoji = false;
  isHoveringMention = false;
  isHoveringSend = false;

  get editingMessage() { return this._editingMessage; }

  @Output() editFinished = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<{
    contextType: 'channel' | 'conversation';
    channelId?: string;
    conversationId?: string;
  }>();
  @Output() threadMessageSent = new EventEmitter<{ text: string }>();
  isEditing = false;
  emojiReactions = emojiReactions;
  private _editingMessage?: { id: string; text: string };
  private newMessage = inject(NewMessageService);
  private threadService = inject(ThreadService);
  private mentionService = inject(MessageInputMentionService);
  private emojiService = inject(MessageInputEmojiService);
  private caretService = inject(MessageInputCaretService);
  private validationService = inject(MessageInputValidationService);
  private sendService = inject(MessageInputSendService);
  private mentionDropdown = inject(MessageInputMentionDropdownService);
  public state = inject(MessageInputStateService);
  public userService = inject(UserService);
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLDivElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  constructor(private messageInputService: MessageInputService) {
    effect(() => {
      const focusCount = this.threadService.focusRequested();

      if (this.contextType === 'thread' && focusCount > 0) {
        setTimeout(() => {
          this.messageInput?.nativeElement.focus();
          console.log('✅ Thread-Focus gesetzt via Signal');
        }, 50);
      }
    });
  }

  ngOnInit(): void {
    this.messageInputService.loadUsers().subscribe((users) => { this.state.setUsers(users); });
    this.messageInputService.loadChannels().subscribe((channels) => { this.state.setChannels(channels); });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const channelChanged = changes['channel'] && !changes['channel'].firstChange;
    const conversationChanged = changes['conversationId'] && !changes['conversationId'].firstChange;

    if (channelChanged || conversationChanged) {
      this.clearAndFocusInput();
    }
  }

  private clearAndFocusInput(): void {
    setTimeout(() => {
      const input = this.messageInput?.nativeElement;
      if (input) {
        input.innerHTML = '';
        input.focus();
      }
    }, 100);
  }

  getAvatarSrc(id: AvatarId): string { return getAvatarById(id).src; }

  onInput(event: Event): void {
    this.validateMentions();
    this.checkAndClearEmptyInput();
  }

  private checkAndClearEmptyInput(): void {
    const div = this.messageInput?.nativeElement;
    if (!div) return;

    const text = this.caretService.getTextContent(div).trim();
    if (text.length === 0) {
      div.innerHTML = '';
    }
  }

  private validateMentions(): void {
    const div = this.messageInput?.nativeElement;
    if (!div) return;

    const currentPos = this.caretService.getCaretPosition(div);
    const newHTML = this.getFormattedHTML(div);

    if (div.innerHTML !== newHTML) {
      this.updateDivContent(div, newHTML, currentPos);
    }
  }

  private getFormattedHTML(div: HTMLDivElement): string {
    const text = this.caretService.getTextContent(div);
    return this.validationService.validateAndFormatMentions(
      text,
      this.state.users(),
      this.validationService.escapeHtml.bind(this.validationService)
    );
  }

  private updateDivContent(div: HTMLDivElement, html: string, caretPos: number): void {
    div.innerHTML = html;
    this.caretService.setCaretPosition(div, caretPos);
  }

  onKeyup(event: KeyboardEvent | Event): void {
    if (this.shouldIgnoreKeyup(event)) return;
    const value = this.caretService.getTextContent(this.messageInput?.nativeElement);
    this.mentionDropdown.handleKeyup(value);
    if (this.state.showMentions()) {
      this.updateMentionPosition();
    }
  }

  private shouldIgnoreKeyup(event: KeyboardEvent | Event): boolean {
    if (event instanceof KeyboardEvent) {
      return ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key);
    }
    return false;
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.state.showMentions() && this.state.activeMentionType()) {
      if (this.handleMentionNav(event)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onEnter(event);
    }
  }

  private handleMentionNav(event: KeyboardEvent): boolean {
    if (this.mentionDropdown.handleKeyboardNavigation(event)) {
      return true;
    }

    const items = this.mentionDropdown.getCurrentItems();
    if ((event.key === 'Enter' || event.key === 'Tab') && items.length > 0) {
      this.selectMention();
      return true;
    }

    return false;
  }

  private selectMention(): void {
    const item = this.mentionDropdown.getSelectedItem();
    if (!item) return;

    if (this.state.activeMentionType() === 'user') {
      this.onSelectUser(item as User);
    } else {
      this.onSelectChannel(item as Channel);
    }
  }

  private updateMentionPosition(): void {
    const div = this.messageInput?.nativeElement;
    if (!div) return;
    const containerEl = this.container.nativeElement;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    this.state.setMentionPosition({
      left: rect.left - containerRect.left,
      bottom: containerRect.bottom - rect.bottom + 8,
      top: rect.bottom - containerRect.top + 8,
    });
  }

  getListLabel(user: User): string {
    return this.mentionService.getListLabel(user, this.currentUserUid);
  }

  getMentionLabel(user: User): string {
    return this.mentionService.getMentionLabel(user);
  }

  onSelectUser(user: User): void {
    const div = this.messageInput?.nativeElement;
    if (!div) return;

    const text = this.caretService.getTextContent(div);
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex === -1) return;

    const mentionText = `@${this.getMentionLabel(user)}`;
    this.insertMention(div, text, lastAtIndex, '@', mentionText, true);
  }

  private insertMention(
    div: HTMLDivElement,
    text: string,
    triggerIndex: number,
    trigger: string,
    mentionText: string,
    isUser: boolean
  ): void {
    const { before, after } = this.extractParts(text, triggerIndex, trigger);
    const finalHtml = this.createMentionHtml(before, mentionText, after, isUser);
    this.applyMentionHtml(div, finalHtml, before.length + mentionText.length + 1);
  }

  private createMentionHtml(
    before: string,
    mentionText: string,
    after: string,
    isUser: boolean
  ): string {
    const escapeHtml = this.validationService.escapeHtml.bind(this.validationService);
    return isUser
      ? this.validationService.createMentionHtml(before, mentionText, after, escapeHtml)
      : this.validationService.createChannelHtml(before, mentionText, after, escapeHtml);
  }

  private applyMentionHtml(div: HTMLDivElement, html: string, caretPos: number): void {
    div.innerHTML = html;
    this.caretService.setCaretPosition(div, caretPos);
    this.state.resetMentions();
  }

  onSelectChannel(channel: Channel): void {
    const div = this.messageInput?.nativeElement;
    if (!div) return;

    const text = this.caretService.getTextContent(div);
    const lastHashIndex = text.lastIndexOf('#');
    if (lastHashIndex === -1) return;

    const channelText = `#${channel.name ?? ''}`;
    this.insertMention(div, text, lastHashIndex, '#', channelText, false);
  }

  private extractParts(
    text: string,
    triggerIndex: number,
    trigger: string
  ): { before: string; after: string } {
    const afterTrigger = text.slice(triggerIndex + 1);
    const spaceIndex = afterTrigger.search(/\s/);
    const queryEndIndex = spaceIndex === -1 ? text.length : triggerIndex + 1 + spaceIndex;

    return {
      before: text.slice(0, triggerIndex),
      after: text.slice(queryEndIndex),
    };
  }

  get isChannelMember(): boolean {
    return this.state.isChannelMember(
      this.contextType,
      this.channel,
      this.currentUserUid
    );
  }

  get isReadOnly(): boolean {
    return this.state.isReadOnly(
      this.contextType,
      this.forceEditable,
      this.isChannelMember
    );
  }

  get isInputEmpty(): boolean {
    const div = this.messageInput?.nativeElement;
    if (!div) return true;
    const text = this.caretService.getTextContent(div).trim();
    return text.length === 0;
  }

  onEnter(event: KeyboardEvent | Event): void {
    if ((event as KeyboardEvent).shiftKey) return;
    if (this.isReadOnly) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    this.onSend();
  }

  async onSend(): Promise<void> {
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

  private handleThreadSend(text: string): void {
    this.threadMessageSent.emit({ text });
    this.afterSend();
  }

  private isNewMessageFlow(): boolean {
    return (
      this.forceEditable &&
      this.contextType === 'conversation' &&
      !this.conversationId &&
      !this.channel
    );
  }

  private async handleNewMessageFlow(text: string): Promise<void> {
    const ok = await this.newMessage.sendAndNavigate(text);
    if (ok) this.afterSend();
  }

  private async handleNormalSend(text: string): Promise<void> {
    if (!this.currentUserUid) {
      return;
    }

    try {
      const ctx = await this.executeSend(text);
      this.afterSend();
      this.messageSent.emit(ctx);
    } catch (error) {
    }
  }

  private async executeSend(text: string) {
    return await this.sendService.sendByContext(
      text,
      this.currentUserUid!,
      this.contextType as 'channel' | 'conversation',
      this.channel?.id,
      this.conversationId ?? undefined,
      this.isEditing,
      this.editingMessage?.id
    );
  }

  private getTrimmedText(): string {
    const div = this.messageInput?.nativeElement;
    if (!div) return '';
    return this.caretService.getTextContent(div).trim();
  }

  private afterSend(): void {
    const div = this.messageInput?.nativeElement;
    if (div) {
      div.innerHTML = '';
    }
    this.state.resetMentions();
    this.isEditing = false;
    this._editingMessage = undefined;
    this.editFinished.emit();
  }

  onAtButtonClick(): void {
    if (this.isReadOnly) return;
    const div = this.messageInput?.nativeElement;
    if (!div) return;
    div.focus();

    this.caretService.insertTextAtCursor(
      div,
      '@',
      this.validationService.escapeHtml.bind(this.validationService)
    );

    this.state.startMention('user');
    this.updateMentionPosition();
  }

  onEmojiButtonClick(): void {
    if (this.isReadOnly) return;
    this.state.toggleEmojiPicker();
  }

  onEmojiSelect(emoji: string): void {
    const div = this.messageInput?.nativeElement;
    if (!div) return;

    this.caretService.insertTextAtCursor(
      div,
      emoji,
      this.validationService.escapeHtml.bind(this.validationService)
    );

    this.state.closeEmojiPicker();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.state.showEmojiPicker()) return;
    const target = event.target as HTMLElement;
    if (this.emojiService.shouldCloseEmojiPicker(target)) {
      this.state.closeEmojiPicker();
    }
  }
}