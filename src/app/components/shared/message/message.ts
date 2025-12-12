import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, tap } from 'rxjs';

import { Channel } from '../../../models/channel.interface';
import { FirestoreService } from '../../../services/firestore';
import { ChannelService } from '../../../services/channel.service';
import { ConversationService } from '../../../services/conversation.service';
import { MessageService } from '../../../services/message.service';

import { MessageData } from '../../../models/message.interface';
import { User } from '../../../models/user.model';
import { getAvatarById } from '../../../../shared/data/avatars';
import {
  ReactionId,
  ReactionDef,
  getReactionDef,
  emojiReactions as EMOJI_REACTIONS,
} from '../../../../shared/data/reactions';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message implements OnChanges {
  /**
   * Kontext:
   * - 'channel' → Nachrichten aus einem Channel
   * - 'conversation' → Nachrichten aus einer DM (Conversation-ID)
   *
   * In der Channel-View kannst du dieses Input einfach weglassen (Standard = 'channel').
   */
  @Input() contextType: 'channel' | 'conversation' = 'channel';

  /** Channel-Kontext (für contextType === 'channel') */
  @Input() channel?: Channel;

  /** Conversation-Kontext (für contextType === 'conversation') */
  @Input() conversationId?: string | null;

  /** aktueller User */
  @Input() currentUserUid: string | null = null;

  /** Bearbeiten-Event für Message-Input */
  @Output() editRequested = new EventEmitter<MessageData>();

  messages$?: Observable<MessageData[]>;
  users: User[] = [];
  hoveredReaction: ReactionId | null = null;
  hoveredMessageId: string | null = null;
  lastMessageCount = 0;

  @ViewChild('bottom') bottom!: ElementRef<HTMLDivElement>;
  private userMap = new Map<string, User>();

  reactionPickerForMessageId: string | null = null;
  emojiReactions: ReactionDef[] = EMOJI_REACTIONS as ReactionDef[];

  constructor(
    private firestoreService: FirestoreService,
    private channelService: ChannelService,
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {
    // User-Map zum schnellen Zugriff
    this.firestoreService.getCollection<User>('users').subscribe((users) => {
      this.users = users;
      this.userMap.clear();
      for (const u of users) {
        if (u.uid) {
          this.userMap.set(u.uid, u);
        }
      }
    });
  }

  // ----------------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------------

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['channel'] ||
      changes['conversationId'] ||
      changes['contextType']
    ) {
      this.loadMessages();
    }
  }

  // ----------------------------------------------------------
  // Nachrichten laden (Channel vs Conversation)
  // ----------------------------------------------------------

  private loadMessages() {
    if (this.contextType === 'channel') {
      if (!this.channel?.id) {
        console.warn(
          'MessageComponent: Channel hat keine ID → Channel-Nachrichten können nicht geladen werden.'
        );
        this.messages$ = undefined;
        return;
      }

      this.messages$ = this.channelService
        .getChannelMessages(this.channel.id)
        .pipe(tap((msgs) => this.handleScrollOnNewMessages(msgs.length)));
    } else {
      // conversation
      if (!this.conversationId) {
        console.warn(
          'MessageComponent: Keine conversationId gesetzt → DM-Nachrichten können nicht geladen werden.'
        );
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
      if (retry) {
        setTimeout(() => this.scrollToBottom(false), 50);
      }
      return;
    }
    this.bottom.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  // ----------------------------------------------------------
  // Sender / Anzeige-Helfer
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // Editieren
  // ----------------------------------------------------------

  onEditMessage(msg: MessageData) {
    if (!this.isOwnMessage(msg)) return;
    this.editRequested.emit(msg);
  }

  // ----------------------------------------------------------
  // Reactions (jetzt über MessageService)
  // ----------------------------------------------------------

  toggleReaction(msg: MessageData, reactionId: ReactionId) {
    if (!this.currentUserUid || !msg.id) return;

    if (this.contextType === 'channel' && this.channel?.id) {
      this.messageService.toggleReactionOnChannelMessage(
        this.channel.id,
        msg.id,
        reactionId,
        this.currentUserUid
      );
    } else if (
      this.contextType === 'conversation' &&
      this.conversationId
    ) {
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

  onMessageMouseLeave(msg: MessageData) {
    if (this.reactionPickerForMessageId === msg.id) {
      this.reactionPickerForMessageId = null;
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

    if (uids.length === 1) {
      return this.getUserDisplayName(uids[0]);
    }

    if (uids.length === 2) {
      return (
        this.getUserDisplayName(uids[0]) +
        ' und ' +
        this.getUserDisplayName(uids[1])
      );
    }

    const others = uids.length - 1;
    return `${this.getUserDisplayName(uids[0])} und ${others} weitere`;
  }
}
