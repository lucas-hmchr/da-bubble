import { Component, Input, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadService } from '../../../services/thread.service';
import { UserService } from '../../../services/user.service';
import { FirestoreService } from '../../../services/firestore';
import { MessageData } from '../../../models/message.interface';
import { User } from '../../../models/user.model';
import { getAvatarById } from '../../../../shared/data/avatars';
import { MessageService } from '../../../services/message.service';
import type { ReactionId } from '../../../../shared/data/reactions';
import { MessageInput } from '../../shared/message-input/message-input';

@Component({
  selector: 'app-thread-menu',
  standalone: true,
  imports: [CommonModule, MessageInput],
  templateUrl: './thread-menu.html',
  styleUrl: './thread-menu.scss',
})
export class ThreadMenu {
  @Input() currentUserUid: string | null = null;

  public threadService = inject(ThreadService);
  private userService = inject(UserService);
  private firestore = inject(FirestoreService);
  private messageService = inject(MessageService);

  // Alle User für Avatar/Namen-Lookup
  private allUsers = computed(() => this.firestore.userList());

  constructor() {
    // Auto-close Thread bei bestimmten Events (siehe app-shell)
  }

  /**
   * Thread schließen
   */
  closeThread() {
    this.threadService.close();
  }

  /**
   * Thread-Message gesendet
   */
  async onThreadMessageSent(event: { text: string }) {
    if (!this.currentUserUid) {
      console.warn('Thread: No current user');
      return;
    }

    try {
      await this.threadService.sendThreadMessage(event.text, this.currentUserUid);
    } catch (error) {
      console.error('Thread: Failed to send message', error);
    }
  }

  /**
   * Avatar-URL für User
   */
  getAvatarSrc(senderId: string): string {
    const user = this.getUserById(senderId);
    if (user?.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return '/images/avatars/avatar_default.svg';
  }

  /**
   * Sender-Name für Message
   */
  getSenderName(senderId: string): string {
    const user = this.getUserById(senderId);
    return user?.displayName || user?.name || 'Unbekannter Nutzer';
  }

  /**
   * User by ID
   */
  private getUserById(uid: string): User | undefined {
    return this.allUsers().find((u) => u.uid === uid);
  }

  /**
   * Hat die Message Reactions?
   */
  hasReactions(msg: MessageData): boolean {
    if (!msg.reactions) return false;
    return Object.keys(msg.reactions).length > 0;
  }

  /**
   * Reaction-IDs einer Message
   */
  getReactionIds(msg: MessageData): ReactionId[] {
    if (!msg.reactions) return [];
    return Object.keys(msg.reactions) as ReactionId[];
  }

  /**
   * Anzahl User für eine Reaction
   */
  getReactionCount(msg: MessageData, reactionId: ReactionId): number {
    if (!msg.reactions || !msg.reactions[reactionId]) return 0;
    return msg.reactions[reactionId]!.length;
  }

  /**
   * Hat der aktuelle User diese Reaction gegeben?
   */
  hasCurrentUserReaction(msg: MessageData, reactionId: ReactionId): boolean {
    if (!this.currentUserUid || !msg.reactions || !msg.reactions[reactionId]) {
      return false;
    }
    return msg.reactions[reactionId]!.includes(this.currentUserUid);
  }

  /**
   * Reaction togglen
   */
  async toggleReaction(msg: MessageData, reactionId: ReactionId) {
    if (!this.currentUserUid || !msg.id) return;

    const contextType = this.threadService.contextType();
    const contextId = this.threadService.contextId();
    const parentMsgId = this.threadService.parentMessage()?.id;

    if (!contextId || !parentMsgId) return;

    try {
      // Thread-Message Reactions haben den gleichen Pfad wie normale Messages
      // nur mit /threadMessages statt /messages
      if (contextType === 'channel') {
        const path = `channels/${contextId}/messages/${parentMsgId}/threadMessages`;
        await this.toggleReactionForPath(path, msg.id, reactionId);
      } else {
        const path = `conversations/${contextId}/messages/${parentMsgId}/threadMessages`;
        await this.toggleReactionForPath(path, msg.id, reactionId);
      }
    } catch (error) {
      console.error('Thread: Failed to toggle reaction', error);
    }
  }

  /**
   * Reaction für einen Pfad togglen
   */
  private async toggleReactionForPath(
    basePath: string,
    messageId: string,
    reactionId: ReactionId
  ) {
    const docPath = `${basePath}/${messageId}`;
    
    // Message laden
    const message = await this.firestore.getDocument<MessageData>(docPath).toPromise();
    if (!message) return;

    const reactions = { ...(message.reactions ?? {}) };
    const currentUsers = new Set<string>(reactions[reactionId] ?? []);

    // Toggle
    if (currentUsers.has(this.currentUserUid!)) {
      currentUsers.delete(this.currentUserUid!);
    } else {
      currentUsers.add(this.currentUserUid!);
    }

    // Update oder löschen
    if (currentUsers.size === 0) {
      delete reactions[reactionId];
    } else {
      reactions[reactionId] = Array.from(currentUsers);
    }

    await this.firestore.updateDocument(basePath, messageId, { reactions });
  }

  /**
   * Ist eigene Message?
   */
  isOwnMessage(msg: MessageData): boolean {
    return msg.senderId === this.currentUserUid;
  }

  /**
   * Datum formatieren
   */
  toDate(date: any): Date {
    if (!date) return new Date();
    if (date.toDate) return date.toDate();
    return new Date(date);
  }

  /**
   * Online-Status Icon
   */
  getOnlineStatusIcon(senderId: string): string {
    const user = this.getUserById(senderId);
    if (!user) return '/assets/icons/global/Offline.svg';
    return this.userService.getOnlineStatusIcon(user);
  }
}