import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../../models/channel.interface';
import { FirestoreService } from '../../../services/firestore';
import { MessageService } from '../../../services/message/message.service';
import { MessageFormatterService } from '../../../services/message/message-formatter.service';
import { MessageScrollService } from '../../../services/message/message-scroll.service';
import { MessageReactionService } from '../../../services/message/message-reaction.service';
import { MessageEditService } from '../../../services/message/message-edit.service';
import { MessageUiService } from '../../../services/message/message-ui.service';
import { MessageHelperService } from '../../../services/message/message-helper.service';
import { MessageDataService } from '../../../services/message/message-data.service';
import { MessageDeleteService } from '../../../services/message/message-delete.service';
import { MessageEmojiStorageService } from '../../../services/message/message-emoji-storage.service';
import { MessageData } from '../../../models/message.interface';
import { User } from '../../../models/user.model';
import {
  ReactionId,
  ReactionDef,
  getReactionDef,
  emojiReactions as EMOJI_REACTIONS,
} from '../../../../shared/data/reactions';
import { ProfilePopupService } from '../../../services/profile-popup.service';
import { ProfilePopup } from '../profile-popup/profile-popup';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilePopup],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message implements OnChanges {
  @Input() contextType: 'channel' | 'conversation' | 'thread' = 'channel';
  @Input() channel?: Channel;
  @Input() conversationId?: string | null;
  @Input() currentUserUid: string | null = null;
  @Input() threadChannelId?: string | null;
  @Input() threadParentMessageId?: string | null;
  @Input() externalMessages?: MessageData[] | null;
  @Input() isThreadContext: boolean = false;
  @Input() showFullDate?: boolean = false;
  @Output() editRequested = new EventEmitter<MessageData>();
  @Output() threadRequested = new EventEmitter<MessageData>();

  messages$?: Observable<MessageData[]>;
  users: User[] = [];
  emojiReactions: ReactionDef[] = EMOJI_REACTIONS as ReactionDef[];
  recentEmojis: ReactionId[] = [];
  private previousExternalMessagesCount = 0;
  
  // Hover states für Action-Icons
  isHoveringReaction = false;
  isHoveringThread = false;
  isHoveringOptions = false;
  
  readonly getReactionDef = getReactionDef;

  @ViewChild('bottom') bottom!: ElementRef<HTMLDivElement>;

  private profilePopupService = inject(ProfilePopupService);

  constructor(
    private firestoreService: FirestoreService,
    private messageService: MessageService,
    private hostEl: ElementRef<HTMLElement>,
    public formatter: MessageFormatterService,
    public scrollService: MessageScrollService,
    public reactionService: MessageReactionService,
    public editService: MessageEditService,
    public uiService: MessageUiService,
    public helper: MessageHelperService,
    private dataService: MessageDataService,
    private deleteService: MessageDeleteService,
    private emojiStorage: MessageEmojiStorageService
  ) {
    this.recentEmojis = this.emojiStorage.loadRecentEmojis();
    this.loadUsers();
  }

  private loadUsers(): void {
    this.firestoreService.getCollection<User>('users').subscribe((users) => {
      this.users = users;
      this.helper.buildUserMap(users);
    });
  }

  getQuickEmojis(): ReactionId[] {
    return this.recentEmojis;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.handleExternalMessagesChange(changes);
    this.handleChannelChange(changes);
    this.handleConversationChange(changes);
    this.handleContextTypeChange(changes);
  }

  private handleExternalMessagesChange(changes: SimpleChanges): void {
    if (!changes['externalMessages'] || !this.externalMessages?.length) return;
    this.messages$ = of(this.externalMessages);
    const currentCount = this.externalMessages.length;
    if (currentCount > this.previousExternalMessagesCount) {
      setTimeout(() => this.scrollService.scrollToBottom(this.bottom, this.isThreadContext), 200);
    }
    this.previousExternalMessagesCount = currentCount;
  }

  private handleChannelChange(changes: SimpleChanges): void {
    if (!changes['channel']) return;
    const oldId = changes['channel'].previousValue?.id;
    const newId = changes['channel'].currentValue?.id;
    if (oldId !== newId) {
      this.loadMessagesIfNeeded();
      this.resetEditState();
    }
  }

  private handleConversationChange(changes: SimpleChanges): void {
    if (!changes['conversationId']) return;
    const oldId = changes['conversationId'].previousValue;
    const newId = changes['conversationId'].currentValue;
    if (oldId !== newId) {
      this.loadMessagesIfNeeded();
      this.resetEditState();
    }
  }

  private handleContextTypeChange(changes: SimpleChanges): void {
    if (!changes['contextType']) return;
    this.loadMessagesIfNeeded();
    this.resetEditState();
  }

  private loadMessagesIfNeeded(): void {
    if (!this.externalMessages || this.externalMessages.length === 0) {
      this.loadMessages();
      this.scheduleScroll();
    }
  }

  private scheduleScroll(): void {
    setTimeout(() => {
      this.messages$?.pipe(take(1)).subscribe(() => {
        setTimeout(() => this.scrollService.scrollToBottom(this.bottom, this.isThreadContext), 200);
      });
    }, 100);
  }

  private resetEditState(): void {
    this.editService.tryDiscardEdit('context-change');
    this.uiService.closeOptionsMenu();
    this.uiService.closeReactionPicker();
  }

  private loadMessages(): void {
    const getBottom = () => this.bottom;
    if (this.contextType === 'channel' && this.channel?.id) {
      this.loadChannelMessages(this.channel.id, getBottom);
    } else if (this.contextType === 'conversation' && this.conversationId) {
      this.loadConversationMessages(this.conversationId, getBottom);
    } else {
      this.messages$ = undefined;
    }
  }

  private loadChannelMessages(channelId: string, getBottom: () => any): void {
    this.messages$ = this.dataService.loadChannelMessages(
      channelId,
      getBottom,
      this.isThreadContext
    );
  }

  private loadConversationMessages(conversationId: string, getBottom: () => any): void {
    this.messages$ = this.dataService.loadConversationMessages(
      conversationId,
      getBottom,
      this.isThreadContext
    );
  }

  onOpenThread(msg: MessageData): void {
    if (!msg.id) return;
    this.uiService.closeReactionPicker();
    this.threadRequested.emit(msg);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.editService.getEditingMessageId()) return;
    const target = ev.target as HTMLElement | null;
    if (target) this.handleOutsideClick(target);
  }

  private handleOutsideClick(target: HTMLElement): void {
    const isInside = target.closest('.inline-edit') || target.closest('.message-options-menu') || target.closest('.option-btn');
    if (!isInside) this.editService.tryDiscardEdit('outside-click');
  }

  get editingMessageId(): string | null { return this.editService.getEditingMessageId(); }
  get editText(): string { return this.editService.getEditText(); }
  set editText(value: string) { this.editService.setEditText(value); }
  get canSaveInlineEdit(): boolean { return this.editService.canSave(); }
  get reactionPickerForMessageId(): string | null { return this.uiService.getReactionPickerMessageId(); }
  get optionsMenuForMessageId(): string | null { return this.uiService.getOptionsMenuMessageId(); }
  get optionsMenuOpenUp(): boolean { return this.uiService.isOptionsMenuOpenUp(); }
  get hoveredReaction(): ReactionId | null { return this.uiService.getHoveredReaction().reactionId; }
  get hoveredMessageId(): string | null { return this.uiService.getHoveredReaction().messageId; }

  getUniqueMessageId(msg: MessageData): string | null {
    return this.uiService.getUniqueMessageId(msg, this.isThreadContext);
  }

  startInlineEdit(msg: MessageData): void {
    this.editService.startEdit(msg);
    setTimeout(() => this.focusEditTextarea(msg.id), 50);
  }

  private focusEditTextarea(msgId?: string): void {
    if (!msgId) return;
    const textarea = this.hostEl.nativeElement.querySelector(
      `textarea[data-edit-id="${msgId}"]`
    ) as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }

  cancelInlineEdit(): void {
    this.editService.cancelEdit();
  }

  async saveInlineEdit(msg: MessageData): Promise<void> {
    const contextId = this.getContextId();
    if (!contextId) return;
    await this.editService.saveEdit(
      msg,
      this.contextType,
      contextId,
      this.isThreadContext,
      this.threadParentMessageId ?? undefined
    );
  }

  onInlineEditKeydown(ev: KeyboardEvent, msg: MessageData): void {
    if (ev.key === 'Escape') this.cancelInlineEdit();
    else if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.saveInlineEdit(msg);
    }
  }

  async toggleReaction(msg: MessageData, reactionId: ReactionId): Promise<void> {
    if (!this.currentUserUid) return;
    const contextId = this.getContextId();
    if (!contextId) return;
    this.recentEmojis = this.emojiStorage.saveRecentEmoji(reactionId, this.recentEmojis);
    await this.reactionService.toggleReaction(
      msg, reactionId, this.currentUserUid, this.contextType,
      contextId, this.isThreadContext, this.threadParentMessageId ?? undefined
    );
  }

  private getContextId(): string | null {
    if (this.contextType === 'channel') return this.channel?.id ?? null;
    if (this.contextType === 'conversation') return this.conversationId ?? null;
    if (this.contextType === 'thread') return this.channel?.id ?? this.conversationId ?? null;
    return null;
  }

  getVisibleReactionIds(msg: MessageData): ReactionId[] {
    return this.reactionService.getVisibleReactionIds(msg, this.isThreadContext);
  }

  getRemainingReactionsCount(msg: MessageData): number {
    return this.reactionService.getRemainingReactionsCount(msg, this.isThreadContext);
  }

  onToggleReactionPicker(msg: MessageData): void {
    if (!msg.id) return;
    const context = this.isThreadContext ? 'thread' : 'view';
    this.uiService.toggleReactionPicker(msg.id, context);
  }

  onEmojiReaction(msg: MessageData, reactionId: ReactionId): void {
    this.toggleReaction(msg, reactionId);
    this.uiService.closeReactionPicker();
  }

  isLastMessage(msg: MessageData, messages: MessageData[]): boolean {
    return this.uiService.isLastMessage(msg, messages);
  }

  toggleOptionsMenu(ev: MouseEvent, msgId: string): void {
    ev.stopPropagation();
    this.uiService.closeReactionPicker();
    const context = this.isThreadContext ? 'thread' : 'view';
    this.uiService.toggleOptionsMenu(msgId, context);
    if (this.uiService.getOptionsMenuMessageId() === msgId) {
      this.uiService.calculateMenuPosition(ev);
    }
  }

  onOptionsMenuMouseEnter(): void {
    this.uiService.setOptionsMenuHovered(true);
  }

  onOptionsMenuMouseLeave(): void {
    this.uiService.setOptionsMenuHovered(false);
    this.uiService.closeOptionsMenu();
  }

  closeOptionsMenu(): void {
    this.uiService.closeOptionsMenu();
  }

  onMessageMouseLeave(msg: MessageData): void {
    if (this.uiService.getIsOptionsMenuHovered()) return;
    if (this.uiService.getReactionPickerMessageId() === msg.id) {
      this.uiService.closeReactionPicker();
    }
    this.uiService.closeAllOverlays();
  }

  async onDeleteMessage(msg: any): Promise<void> {
    if (!msg?.id || !this.helper.isOwnMessage(msg.senderId, this.currentUserUid)) return;
    const contextId = this.getContextId();
    if (!contextId) return;
    if (this.deleteService.confirmThreadDeletion(msg, this.isThreadContext)) {
      await this.deleteService.deleteMessage(
        msg,
        this.contextType,
        contextId,
        this.isThreadContext,
        this.threadParentMessageId ?? undefined
      );
    }
  }

  onHoverReaction(messageId: string, reactionId: ReactionId): void {
    this.uiService.setHoveredReaction(messageId, reactionId);
  }

  onLeaveReaction(): void {
    this.uiService.setHoveredReaction(null, null);
  }

  getReactionUserLabel(msg: MessageData, reactionId: ReactionId): string {
    return this.reactionService.getReactionUserLabel(msg, reactionId, this.users);
  }

  hasUserReacted(msg: MessageData, reactionId: ReactionId): boolean {
    if (!this.currentUserUid) return false;
    return this.reactionService.hasCurrentUserReaction(msg, reactionId, this.currentUserUid);
  }

  openUserProfile(userId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.profilePopupService.open(userId);
  }

  onMessageTextClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userId = this.formatter.getUserIdFromElement(target);
    if (userId) {
      event.preventDefault();
      event.stopPropagation();
      this.openUserProfile(userId, event);
    }
  }

  getFullDateTimeString(date: Date | any): string {
    const formattedDate = this.formatter.getFormattedDate(date);
    const msgDate = this.formatter.toDate(date);
    if (!msgDate) return formattedDate;
    const time = msgDate.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${formattedDate} ${time} Uhr`;
  }

  trackByMessageId(index: number, msg: MessageData): string {
    return msg.id || index.toString();
  }
}