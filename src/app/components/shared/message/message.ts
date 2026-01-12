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
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, tap, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

import { Channel } from '../../../models/channel.interface';
import { FirestoreService } from '../../../services/firestore';
import { ChannelService } from '../../../services/channel.service';
import { ConversationService } from '../../../services/conversation.service';
import { MessageService } from '../../../services/message.service';
import { MessageInputService } from '../../../services/message-intput.service';

import { MessageData } from '../../../models/message.interface';
import { User } from '../../../models/user.model';
import { getAvatarById } from '../../../../shared/data/avatars';
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
  hoveredReaction: ReactionId | null = null;
  hoveredMessageId: string | null = null;
  lastMessageCount = 0;

  private isFirstLoad = true;
  private hasScrolledToBottom = false;
  @ViewChild('bottom') bottom!: ElementRef<HTMLDivElement>;

  private userMap = new Map<string, User>();
  private profilePopupService = inject(ProfilePopupService);
  private previousMessageCount?: number;

  reactionPickerForMessageId: string | null = null;
  emojiReactions: ReactionDef[] = EMOJI_REACTIONS as ReactionDef[];
  optionsMenuForMessageId: string | null = null;
  optionsMenuOpenUp = false;
  isOptionsMenuHovered = false;

  editingMessageId: string | null = null;
  editText: string = '';
  private originalEditText: string = '';

  /**
   * OPTIONAL:
   * true  -> wenn Text geändert ist, fragt Outside-Click/Wechsel "Änderungen verwerfen?"
   * false -> Outside-Click/Wechsel bricht immer kommentarlos ab
   */
  private confirmDiscardOnOutside = true;

  constructor(
    private firestoreService: FirestoreService,
    private channelService: ChannelService,
    private conversationService: ConversationService,
    private messageService: MessageService,
    private messageInputService: MessageInputService,
    private hostEl: ElementRef<HTMLElement>
  ) {
    this.firestoreService.getCollection<User>('users').subscribe((users) => {
      this.users = users;
      this.userMap.clear();
      for (const u of users) {
        if (u.uid) this.userMap.set(u.uid, u);
      }
    });
  }


  ngOnChanges(changes: SimpleChanges): void {

    if (changes['externalMessages']) {
      if (this.externalMessages && this.externalMessages.length > 0) {
        this.messages$ = of(this.externalMessages);

        // ⭐ HIER fehlt der Scroll!
        setTimeout(() => {
          this.scrollToBottom();
        }, 200);

        return;
      }
    }

    if (changes['channel']) {
      const oldId = changes['channel'].previousValue?.id;
      const newId = changes['channel'].currentValue?.id;


      if (oldId !== newId) {

        if (!this.externalMessages || this.externalMessages.length === 0) {
          this.loadMessages();

          setTimeout(() => {
            if (this.messages$) {
              this.messages$.pipe(take(1)).subscribe((messages) => {
                setTimeout(() => {
                  this.scrollToBottom();
                }, 200);
              });
            }
          }, 100);
        }

        this.tryDiscardInlineEdit('context-change');
        this.closeOptionsMenu();
        this.reactionPickerForMessageId = null;
      }
      return;
    }

    if (changes['conversationId']) {
      const oldId = changes['conversationId'].previousValue;
      const newId = changes['conversationId'].currentValue;

      if (oldId !== newId) {
        this.isFirstLoad = true;
        this.hasScrolledToBottom = false; // ← Reset!

        if (!this.externalMessages || this.externalMessages.length === 0) {
          this.loadMessages();
        }

        this.tryDiscardInlineEdit('context-change');
        this.closeOptionsMenu();
        this.reactionPickerForMessageId = null;
      }
      return;
    }

    if (changes['contextType']) {
      this.isFirstLoad = true;
      this.hasScrolledToBottom = false; // ← Reset!

      if (!this.externalMessages || this.externalMessages.length === 0) {
        this.loadMessages();
      }

      this.tryDiscardInlineEdit('context-change');
      this.closeOptionsMenu();
      this.reactionPickerForMessageId = null;
    }
  }

  onOpenThread(msg: MessageData) {
    if (!msg.id) {
      return;
    }

    this.threadRequested.emit(msg);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    if (!this.editingMessageId) return;

    const target = ev.target as HTMLElement | null;
    if (!target) return;

    this.handleOutsideClick(target);
  }

  private handleOutsideClick(target: HTMLElement) {
    const insideInlineEdit = !!target.closest('.inline-edit');
    if (insideInlineEdit) return;

    const insideOptionsMenu = !!target.closest('.message-options-menu');
    if (insideOptionsMenu) return;

    const insideOptionsButton = !!target.closest('.option-btn');
    if (insideOptionsButton) return;


    this.tryDiscardInlineEdit('outside-click');
  }

  private tryDiscardInlineEdit(reason: 'outside-click' | 'context-change') {
    if (!this.editingMessageId) return;

    const dirty = this.isInlineEditDirty();

    if (!dirty || !this.confirmDiscardOnOutside) {
      this.cancelInlineEdit();
      return;
    }

    const ok = window.confirm('Änderungen verwerfen?');
    if (ok) this.cancelInlineEdit();
  }

  private isInlineEditDirty(): boolean {
    const a = (this.editText ?? '').trim();
    const b = (this.originalEditText ?? '').trim();
    return a !== b;
  }

  private loadMessages() {
  if (this.contextType === 'channel') {
    if (!this.channel?.id) {
      this.messages$ = undefined;
      return;
    }

    this.messages$ = this.channelService
      .getChannelMessages(this.channel.id)
      .pipe(
        tap((messages) => {
          const previousCount = this.previousMessageCount || 0;
          this.previousMessageCount = messages.length;
          
          if (messages.length > previousCount) {
            setTimeout(() => {
              this.scrollToBottom();
            }, 100);
          }
        })
      );
    
  } else if (this.contextType === 'conversation') {
      if (!this.conversationId) {
        this.messages$ = undefined;
        return;
      }

      this.messages$ = this.conversationService
        .getConversationMessages(this.conversationId)
        .pipe(
          tap((messages) => {
            setTimeout(() => {
              this.scrollToBottom();
            }, 100);
          })
        );

    } else if (this.contextType === 'thread') {
      return;
    }
  }


  private scrollToBottom(retry: boolean = true) {

    if (!this.bottom) {
      if (retry) setTimeout(() => this.scrollToBottom(false), 50);
      return;
    }

    let container: HTMLElement | null = this.bottom.nativeElement.parentElement;

    while (container) {
      const hasScroll = container.scrollHeight > container.clientHeight;

      if (hasScroll && container.classList.contains('messages-scroll')) {
        const isInThread = this.isInThreadMenu(container);

        if (isInThread === this.isThreadContext) {

          const scrollContainer = container;
          const targetScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          const startScroll = scrollContainer.scrollTop;
          const distance = targetScroll - startScroll;
          const duration = 300;
          const startTime = performance.now();

          const animateScroll = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            scrollContainer.scrollTop = startScroll + (distance * easeProgress);

            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            }
          };

          requestAnimationFrame(animateScroll);
        }
        return;
      }

      container = container.parentElement;
    }

  }

  private isInThreadMenu(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current) {
      if (current.tagName === 'APP-THREAD-MENU') {
        return true;
      }

      current = current.parentElement;
    }
    return false;
  }

  getSenderName(senderId: string): string {
    const user = this.userMap.get(senderId);
    if (!user) return 'Unknown user';
    return user.displayName ?? user.name ?? 'Unknown user';
  }

  getSenderAvatarUrl(senderId: string): string {
    const user = this.userMap.get(senderId);
    const avatar = getAvatarById(user?.avatarId);
    return avatar.src;
  }

  isOwnMessage(msg: MessageData): boolean {
    return !!this.currentUserUid && msg.senderId === this.currentUserUid;
  }

  isSameDay(a: any, b: any): boolean {
    const d1 = this.toDate(a);
    const d2 = this.toDate(b);
    if (!d1 || !d2) return false;

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value.toDate) return value.toDate();
    return new Date(value);
  }

  startInlineEdit(msg: MessageData) {
    if (!msg?.id) return;
    if (!this.isOwnMessage(msg)) return;

    this.editingMessageId = msg.id;
    this.editText = msg.text ?? '';
    this.originalEditText = this.editText;

    this.closeOptionsMenu();
    this.reactionPickerForMessageId = null;

    setTimeout(() => {
      const el = document.querySelector<HTMLTextAreaElement>(`textarea[data-edit-id="${msg.id}"]`);
      el?.focus();
      const v = el?.value ?? '';
      if (el) el.setSelectionRange(v.length, v.length);
    }, 0);
  }

  cancelInlineEdit() {
    this.editingMessageId = null;
    this.editText = '';
    this.originalEditText = '';
  }

  get canSaveInlineEdit(): boolean {
    const trimmed = (this.editText ?? '').trim();
    const original = (this.originalEditText ?? '').trim();
    return trimmed.length > 0 && trimmed !== original;
  }

  async saveInlineEdit(msg: MessageData) {
    if (!msg?.id) return;
    if (!this.isOwnMessage(msg)) return;

    const newText = (this.editText ?? '').trim();
    if (!newText) return;

    try {
      if (this.isThreadContext && this.threadParentMessageId) {
        if (this.contextType === 'channel') {
          const channelId = this.channel?.id;
          if (!channelId) return;

          await this.messageInputService.updateThreadMessage(
            'channel',
            channelId,
            this.threadParentMessageId,
            msg.id,
            newText
          );
        } else if (this.contextType === 'conversation') {
          const convId = this.conversationId;
          if (!convId) return;

          await this.messageInputService.updateThreadMessage(
            'conversation',
            convId,
            this.threadParentMessageId,
            msg.id,
            newText
          );
        }
      }
      else if (this.contextType === 'channel') {
        const channelId = this.channel?.id;
        if (!channelId) return;
        await this.messageInputService.updateChannelMessage(channelId, msg.id, newText);
      } else {
        const convId = this.conversationId;
        if (!convId) return;
        await this.messageInputService.updateConversationMessage(convId, msg.id, newText);
      }

      this.cancelInlineEdit();
    } catch (e) {
    }
  }

  onInlineEditKeydown(ev: KeyboardEvent, msg: MessageData) {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      this.cancelInlineEdit();
      return;
    }

    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      if (this.canSaveInlineEdit) this.saveInlineEdit(msg);
    }
  }

  toggleReaction(msg: MessageData, reactionId: ReactionId) {
    if (!this.currentUserUid || !msg.id) return;

    if (this.isThreadContext && this.threadParentMessageId) {
      if (this.contextType === 'channel' && this.channel?.id) {
        this.messageService.toggleReactionOnThreadMessage(
          'channel',
          this.channel.id,
          this.threadParentMessageId,
          msg.id,
          reactionId,
          this.currentUserUid
        );
        return;
      }

      if (this.contextType === 'conversation' && this.conversationId) {
        this.messageService.toggleReactionOnThreadMessage(
          'conversation',
          this.conversationId,
          this.threadParentMessageId,
          msg.id,
          reactionId,
          this.currentUserUid
        );
        return;
      }
    }

    if (this.contextType === 'channel' && this.channel?.id) {
      this.messageService.toggleReactionOnChannelMessage(
        this.channel.id,
        msg.id,
        reactionId,
        this.currentUserUid
      );
    } else if (this.contextType === 'conversation' && this.conversationId) {
      this.messageService.toggleReactionOnConversationMessage(
        this.conversationId,
        msg.id,
        reactionId,
        this.currentUserUid
      );
    }
  }

  getReactionIds(msg: MessageData): ReactionId[] {
    const reactions: any = msg.reactions || {};
    return Object.keys(reactions).filter(
      (key) => Array.isArray(reactions[key]) && reactions[key].length > 0
    ) as ReactionId[];
  }

  hasReactions(msg: MessageData): boolean {
    return this.getReactionIds(msg).length > 0;
  }

  hasCurrentUserReaction(msg: MessageData, reactionId: ReactionId): boolean {
    if (!this.currentUserUid || !msg.reactions) return false;
    const users = msg.reactions[reactionId] || [];
    return users.includes(this.currentUserUid);
  }

  getReactionCount(msg: MessageData, reactionId: ReactionId): number {
    const val: any = msg.reactions?.[reactionId];
    if (!Array.isArray(val)) return 0;
    return val.length;
  }

  getReactionDefById(id: ReactionId): ReactionDef {
    return getReactionDef(id);
  }

  onToggleReactionPicker(msg: MessageData) {
    if (!msg.id) return;
    this.reactionPickerForMessageId =
      this.reactionPickerForMessageId === msg.id ? null : msg.id;
  }

  onEmojiReaction(msg: MessageData, reactionId: ReactionId) {
    this.toggleReaction(msg, reactionId);
    this.reactionPickerForMessageId = null;
  }

  toggleOptionsMenu(ev: MouseEvent, msgId: string) {
    ev.stopPropagation();

    if (this.optionsMenuForMessageId === msgId) {
      this.closeOptionsMenu();
      return;
    }

    this.optionsMenuForMessageId = msgId;

    queueMicrotask(() => {
      const btn = ev.currentTarget as HTMLElement | null;
      if (!btn) return;

      const scroll = btn.closest('.messages-scroll') as HTMLElement | null;
      const menu = scroll?.querySelector('.message-options-menu') as HTMLElement | null;

      const menuHeight = menu?.getBoundingClientRect().height ?? 160;
      const margin = 12;

      const btnRect = btn.getBoundingClientRect();
      const scrollRect = (scroll ?? document.documentElement).getBoundingClientRect();

      const spaceBelow = scrollRect.bottom - btnRect.bottom;
      const spaceAbove = btnRect.top - scrollRect.top;

      this.optionsMenuOpenUp =
        spaceBelow < (menuHeight + margin) && spaceAbove > (menuHeight + margin);
    });
  }

  onOptionsMenuMouseEnter() {
    this.isOptionsMenuHovered = true;
  }

  onOptionsMenuMouseLeave() {
    this.isOptionsMenuHovered = false;
    this.closeOptionsMenu();
  }

  closeOptionsMenu() {
    this.optionsMenuForMessageId = null;
    this.optionsMenuOpenUp = false;
    this.isOptionsMenuHovered = false;
  }

  closeOverlays() {
    this.reactionPickerForMessageId = null;
    this.optionsMenuForMessageId = null;
    this.hoveredReaction = null;
    this.hoveredMessageId = null;
  }

  onMessageMouseLeave(msg: MessageData) {
    if (this.isOptionsMenuHovered) return;
    if (this.reactionPickerForMessageId === msg.id) this.reactionPickerForMessageId = null;
    this.closeOverlays();
  }

  async onDeleteMessage(msg: any) {
    if (!msg?.id) return;
    if (!this.isOwnMessage(msg)) return;

    if (this.isThreadContext && this.threadParentMessageId) {
      if (this.contextType === 'channel' && this.channel?.id) {
        await this.messageService.deleteThreadMessage(
          'channel',
          this.channel.id,
          this.threadParentMessageId,
          msg.id
        );
        return;
      }

      if (this.contextType === 'conversation' && this.conversationId) {
        await this.messageService.deleteThreadMessage(
          'conversation',
          this.conversationId,
          this.threadParentMessageId,
          msg.id
        );
        return;
      }
    }


    if (msg.threadCount > 0) {
      const confirmed = window.confirm(
        `Diese Nachricht hat ${msg.threadCount} Antwort(en).\n\n` +
        `Soll die Nachricht samt allen Antworten gelöscht werden?`
      );
      if (!confirmed) return;
    }

    if (this.contextType === 'channel' && this.channel?.id) {
      await this.messageService.deleteChannelMessage(this.channel.id, msg.id);
      return;
    }

    if (this.contextType === 'conversation' && this.conversationId) {
      await this.messageService.deleteConversationMessage(this.conversationId, msg.id);
      return;
    }
  }

  onHoverReaction(messageId: string, reactionId: ReactionId) {
    this.hoveredMessageId = messageId;
    this.hoveredReaction = reactionId;
  }

  onLeaveReaction() {
    this.hoveredMessageId = null;
    this.hoveredReaction = null;
  }

  getReactionUserIds(msg: MessageData, reactionId: ReactionId): string[] {
    return msg.reactions?.[reactionId] || [];
  }

  getUserDisplayName(uid: string): string {
    const user = this.userMap.get(uid);
    return user?.displayName ?? user?.name ?? 'Unbekannter Nutzer';
  }

  getReactionUserLabel(msg: MessageData, reactionId: ReactionId): string {
    const uids = this.getReactionUserIds(msg, reactionId);
    if (!uids.length) return '';

    if (uids.length === 1) return this.getUserDisplayName(uids[0]);
    if (uids.length === 2) return this.getUserDisplayName(uids[0]) + ' und ' + this.getUserDisplayName(uids[1]);

    const others = uids.length - 1;
    return `${this.getUserDisplayName(uids[0])} und ${others} weitere`;
  }

  getFormattedDate(date: Date | any): string {
    const msgDate = this.toDate(date);

    if (!msgDate) {
      return '';
    }

    const currentYear = new Date().getFullYear();
    const messageYear = msgDate.getFullYear();

    if (messageYear === currentYear) {
      return this.formatDate(msgDate, 'd. MMMM');
    }

    return this.formatDate(msgDate, 'd. MMMM yyyy');
  }

  getFormattedDateWithWeekday(date: Date | any): string {
    const msgDate = this.toDate(date);
    if (!msgDate) return '';

    const currentYear = new Date().getFullYear();
    const messageYear = msgDate.getFullYear();

    const weekday = msgDate.toLocaleString('de-DE', { weekday: 'long' });

    if (messageYear === currentYear) {
      const dayMonth = this.formatDate(msgDate, 'd. MMMM');
      return `${weekday}, ${dayMonth}`;
    }

    const dayMonthYear = this.formatDate(msgDate, 'd. MMMM yyyy');
    return `${weekday}, ${dayMonthYear}`;
  }

  private formatDate(date: Date, format: string): string {
    const day = date.getDate();
    const month = date.toLocaleString('de-DE', { month: 'long' });
    const year = date.getFullYear();

    return format
      .replace('d', day.toString())
      .replace('MMMM', month)
      .replace('yyyy', year.toString());
  }

  openUserProfile(userId: string, event?: Event) {
    if (event) {
      event.stopPropagation();  // Verhindert andere Click-Events
    }
    this.profilePopupService.open(userId);
  }

  parseMessageText(text: string): string {
    if (!text) return '';

    const mentionRegex = /@\[([^\]]+)\]|@([A-Za-zäöüÄÖÜß]+(?: [A-Za-zäöüÄÖÜß]+)*)/g;

    const result = text.replace(mentionRegex, (match, bracketName, simpleName) => {
      const displayName = bracketName || simpleName;

      const user = this.findUserByDisplayName(displayName);

      if (user && user.uid) {
        const span = `<span class="mention" data-user-id="${user.uid}">${match}</span>`;
        return span;
      }

      return match;
    });

    return result;
  }

  private findUserByDisplayName(displayName: string): User | undefined {
    const trimmedName = displayName.trim().toLowerCase();

    return this.users.find(user => {
      const userDisplayName = (user.displayName ?? user.name ?? '').toLowerCase();
      return userDisplayName === trimmedName;
    });
  }

  private getUserIdFromElement(element: HTMLElement): string | null {
    if (element.classList.contains('mention')) {
      return element.getAttribute('data-user-id');
    }

    const mentionParent = element.closest('.mention') as HTMLElement | null;
    if (mentionParent) {
      return mentionParent.getAttribute('data-user-id');
    }

    return null;
  }

  onMessageTextClick(event: MouseEvent) {

    const target = event.target as HTMLElement;

    const userId = this.getUserIdFromElement(target);

    if (userId) {
      event.preventDefault();
      event.stopPropagation();
      this.openUserProfile(userId, event);
    }
  }

}
