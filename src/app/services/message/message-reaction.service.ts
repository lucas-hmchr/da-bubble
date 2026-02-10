import { Injectable } from '@angular/core';
import { MessageData } from '../../models/message.interface';
import { ReactionId } from '../../../shared/data/reactions';
import { MessageService } from './message.service';

@Injectable({ providedIn: 'root' })
export class MessageReactionService {
  
  constructor(private messageService: MessageService) {}

  async toggleReaction(
    msg: MessageData,
    reactionId: ReactionId,
    currentUserId: string,
    contextType: 'channel' | 'conversation' | 'thread',
    contextId: string,
    isThreadContext: boolean,
    threadParentMessageId?: string
  ): Promise<void> {
    if (!msg.id || !currentUserId) return;

    if (isThreadContext && threadParentMessageId) {
      const actualContextType = contextType === 'thread' ? 'channel' : contextType;
      await this.toggleThreadReaction(
        msg.id,
        reactionId,
        currentUserId,
        actualContextType,
        contextId,
        threadParentMessageId
      );
      return;
    }

    if (contextType === 'channel') {
      await this.messageService.toggleReactionOnChannelMessage(
        contextId,
        msg.id,
        reactionId,
        currentUserId
      );
      return;
    }

    if (contextType === 'conversation') {
      await this.messageService.toggleReactionOnConversationMessage(
        contextId,
        msg.id,
        reactionId,
        currentUserId
      );
    }
  }

  private async toggleThreadReaction(
    threadMessageId: string,
    reactionId: ReactionId,
    userId: string,
    contextType: 'channel' | 'conversation',
    contextId: string,
    parentMessageId: string
  ): Promise<void> {
    await this.messageService.toggleReactionOnThreadMessage(
      contextType,
      contextId,
      parentMessageId,
      threadMessageId,
      reactionId,
      userId
    );
  }

  getReactionCount(msg: MessageData, reactionId: ReactionId): number {
    const val: any = msg.reactions?.[reactionId];
    if (!Array.isArray(val)) return 0;
    return val.length;
  }

  getReactionUserIds(msg: MessageData, reactionId: ReactionId): string[] {
    return msg.reactions?.[reactionId] || [];
  }

  hasReactions(msg: MessageData): boolean {
    if (!msg.reactions) return false;
    return Object.keys(msg.reactions).some(
      (key) => Array.isArray(msg.reactions![key as ReactionId]) && 
               msg.reactions![key as ReactionId]!.length > 0
    );
  }

  getReactionIds(msg: MessageData): ReactionId[] {
    if (!msg.reactions) return [];
    return Object.keys(msg.reactions).filter(
      (key) => Array.isArray(msg.reactions![key as ReactionId]) && 
               msg.reactions![key as ReactionId]!.length > 0
    ) as ReactionId[];
  }

  hasCurrentUserReaction(msg: MessageData, reactionId: ReactionId, currentUserId: string): boolean {
    const users = msg.reactions?.[reactionId];
    if (!Array.isArray(users)) return false;
    return users.includes(currentUserId);
  }

  getVisibleReactionIds(msg: MessageData, isThreadContext: boolean): ReactionId[] {
    const allReactions = this.getReactionIds(msg);
    const limit = this.getReactionLimit(isThreadContext);
    return allReactions.slice(0, limit);
  }

  getRemainingReactionsCount(msg: MessageData, isThreadContext: boolean): number {
    const allReactions = this.getReactionIds(msg);
    const limit = this.getReactionLimit(isThreadContext);
    return Math.max(0, allReactions.length - limit);
  }

  private getReactionLimit(isThreadContext: boolean): number {
    if (isThreadContext) return 7;
    return this.isMobile() ? 7 : 20;
  }

  private isMobile(): boolean {
    return window.innerWidth <= 1024;
  }

  getReactionUserLabel(msg: MessageData, reactionId: ReactionId, users: any[]): string {
    const uids = this.getReactionUserIds(msg, reactionId);
    if (!uids.length) return '';

    const getUserName = (uid: string) => {
      const user = users.find(u => u.uid === uid);
      return user?.displayName || user?.name || 'Unbekannt';
    };

    if (uids.length === 1) return getUserName(uids[0]);
    if (uids.length === 2) {
      return `${getUserName(uids[0])} und ${getUserName(uids[1])}`;
    }
    return `${getUserName(uids[0])} und ${uids.length - 1} weitere`;
  }
}