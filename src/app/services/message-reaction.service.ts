import { Injectable } from '@angular/core';
import { MessageData } from '../models/message.interface';
import { ReactionId } from '../../shared/data/reactions';
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
    threadParentMessageId?: string
  ): Promise<void> {
    if (!msg.id || !currentUserId) return;

    if (contextType === 'thread' && threadParentMessageId) {
      await this.toggleThreadReaction(
        msg.id,
        reactionId,
        currentUserId,
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
    contextId: string,
    parentMessageId: string
  ): Promise<void> {
    await this.messageService.toggleReactionOnThreadMessage(
      'channel',
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
}