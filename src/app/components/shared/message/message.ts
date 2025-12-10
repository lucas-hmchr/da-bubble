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

import { Channel } from '../../../models/channel.interface';
import { MessageData } from '../../../models/message.interface';
import { User } from '../../../models/user.model';
import { getAvatarById } from '../../../../shared/data/avatars';
import {
  ReactionId,
  ReactionDef,
  getReactionDef,
  emojiReactions as EMOJI_REACTIONS,
} from '../../../../shared/data/reactions';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message implements OnChanges {
  @Input() channel?: Channel;
  @Input() currentUserUid: string | null = null;
  @Input() messages: MessageData[] | null = null;
  @Input() users: User[] = [];

  @Output() editRequested = new EventEmitter<MessageData>();

  @ViewChild('bottom') bottom!: ElementRef<HTMLDivElement>;

  hoveredReaction: ReactionId | null = null;
  hoveredMessageId: string | null = null;
  lastMessageCount = 0;

  reactionPickerForMessageId: string | null = null;
  emojiReactions: ReactionDef[] = EMOJI_REACTIONS as ReactionDef[];

  private userMap = new Map<string, User>();

  constructor(private messageService: MessageService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users']) {
      this.buildUserMap();
    }

    if (changes['messages']) {
      const currentCount = this.messages?.length ?? 0;
      if (currentCount > this.lastMessageCount) {
        setTimeout(() => this.scrollToBottom(), 0);
      }
      this.lastMessageCount = currentCount;
    }
  }

  private buildUserMap() {
    this.userMap.clear();
    for (const u of this.users) {
      if (u.uid) {
        this.userMap.set(u.uid, u);
      }
    }
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

  private scrollToBottom(retry: boolean = true) {
    if (!this.bottom) {
      if (retry) {
        setTimeout(() => this.scrollToBottom(false), 50);
      }
      return;
    }

    this.bottom.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  onEditMessage(msg: MessageData) {
    if (!this.isOwnMessage(msg)) return;
    this.editRequested.emit(msg);
  }

  toggleReaction(msg: MessageData, reactionId: ReactionId) {
    if (!this.channel?.id || !msg.id || !this.currentUserUid) return;

    const reactions = { ...(msg.reactions || {}) };
    const users = reactions[reactionId] ? [...reactions[reactionId]!] : [];
    const idx = users.indexOf(this.currentUserUid);

    if (idx >= 0) {
      users.splice(idx, 1);
    } else {
      users.push(this.currentUserUid);
    }

    if (users.length === 0) {
      delete reactions[reactionId];
    } else {
      reactions[reactionId] = users;
    }

    this.messageService.updateReactions(this.channel.id!, msg.id!, reactions);
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
