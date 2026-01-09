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
import { Observable, tap, of } from 'rxjs';
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
  @Input() isThreadContext?: boolean;
  @Input() showFullDate?: boolean = false;
  @Output() editRequested = new EventEmitter<MessageData>();
  @Output() threadRequested = new EventEmitter<MessageData>();

  messages$?: Observable<MessageData[]>;
  users: User[] = [];
  hoveredReaction: ReactionId | null = null;
  hoveredMessageId: string | null = null;
  lastMessageCount = 0;

  @ViewChild('bottom') bottom!: ElementRef<HTMLDivElement>;
  private userMap = new Map<string, User>();
  private profilePopupService = inject(ProfilePopupService);

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
        return;
      }
    }

    if (changes['channel'] || changes['conversationId'] || changes['contextType']) {

      // ⭐ NEU: Nur laden wenn KEINE externalMessages!
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
      console.warn('Message has no ID, cannot open thread');
      return;
    }

    this.threadRequested.emit(msg);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    // wenn kein Inline-Edit aktiv ist, kein Aufwand
    if (!this.editingMessageId) return;

    const target = ev.target as HTMLElement | null;
    if (!target) return;

    // nur reagieren, wenn Klick überhaupt "in" diesem Message-Component passiert oder außerhalb;
    // relevant ist: wenn außerhalb der Inline-Edit-Box geklickt wird → abbrechen
    this.handleOutsideClick(target);
  }

  private handleOutsideClick(target: HTMLElement) {
    // Klick innerhalb der Edit-UI? dann nichts tun
    const insideInlineEdit = !!target.closest('.inline-edit');
    if (insideInlineEdit) return;

    // Klick im Options-Menü? dann auch nichts tun
    const insideOptionsMenu = !!target.closest('.message-options-menu');
    if (insideOptionsMenu) return;

    // Klick auf Options-Button (3 Punkte) ebenfalls ignorieren
    const insideOptionsButton = !!target.closest('.option-btn');
    if (insideOptionsButton) return;

    // Optional: Klick außerhalb dieses Components komplett ignorieren?
    // Nein: Wir wollen ja genau "außerhalb" abbrechen.

    this.tryDiscardInlineEdit('outside-click');
  }

  private tryDiscardInlineEdit(reason: 'outside-click' | 'context-change') {
    if (!this.editingMessageId) return;

    const dirty = this.isInlineEditDirty();

    if (!dirty || !this.confirmDiscardOnOutside) {
      this.cancelInlineEdit();
      return;
    }

    // Bestätigung nur bei Änderungen
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
        console.warn('MessageComponent: Channel hat keine ID → Channel-Nachrichten können nicht geladen werden.');
        this.messages$ = undefined;
        return;
      }

      this.messages$ = this.channelService
        .getChannelMessages(this.channel.id)
        .pipe(tap((msgs) => this.handleScrollOnNewMessages(msgs.length)));
    } else {
      if (!this.conversationId) {
        console.warn('MessageComponent: Keine conversationId gesetzt → DM-Nachrichten können nicht geladen werden.');
        this.messages$ = undefined;
        return;
      }

      this.messages$ = this.conversationService
        .getConversationMessages(this.conversationId)
        .pipe(tap((msgs) => this.handleScrollOnNewMessages(msgs.length)));
    }
  }

  private handleScrollOnNewMessages(currentCount: number) {
    if (currentCount > this.lastMessageCount) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
    this.lastMessageCount = currentCount;
  }

  private scrollToBottom(retry: boolean = true) {
    if (!this.bottom) {
      if (retry) setTimeout(() => this.scrollToBottom(false), 50);
      return;
    }
    this.bottom.nativeElement.scrollIntoView({ behavior: 'smooth' });
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
      // ========== NEU: Thread-Message Edit ==========
      if (this.isThreadContext && this.threadParentMessageId) {
        if (this.contextType === 'channel') {
          const channelId = this.channel?.id;
          if (!channelId) return;

          // Thread-Message in Channel
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

          // Thread-Message in Conversation
          await this.messageInputService.updateThreadMessage(
            'conversation',
            convId,
            this.threadParentMessageId,
            msg.id,
            newText
          );
        }
      }
      // ========== BESTEHEND: Normal Message Edit ==========
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
      console.error('Fehler beim Speichern der bearbeiteten Nachricht:', e);
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

    // ========== NEU: Thread-Message Reactions ==========
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

    // ========== BESTEHEND: Normal Message Reactions ==========
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

    // ========== THREAD-MESSAGE DELETE (mit threadCount Update) ==========
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

    // ========== PARENT-MESSAGE DELETE (mit Cascade) ==========

    // Confirm-Dialog wenn Thread-Messages vorhanden
    if (msg.threadCount > 0) {
      const confirmed = window.confirm(
        `Diese Nachricht hat ${msg.threadCount} Antwort(en).\n\n` +
        `Soll die Nachricht samt allen Antworten gelöscht werden?`
      );
      if (!confirmed) return;
    }

    // Channel-Message löschen
    if (this.contextType === 'channel' && this.channel?.id) {
      await this.messageService.deleteChannelMessage(this.channel.id, msg.id);
      return;
    }

    // Conversation-Message löschen
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

    // Wenn aktuelles Jahr: Wochentag + Tag + Monat
    if (messageYear === currentYear) {
      const dayMonth = this.formatDate(msgDate, 'd. MMMM');
      return `${weekday}, ${dayMonth}`;
    }

    // Wenn anderes Jahr: Wochentag + Tag + Monat + Jahr
    const dayMonthYear = this.formatDate(msgDate, 'd. MMMM yyyy');
    return `${weekday}, ${dayMonthYear}`;
  }

  /**
   * Helper für Date-Formatting
   */
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

}
