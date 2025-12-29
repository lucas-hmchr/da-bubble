<<<<<<< HEAD
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirestoreService } from './firestore';
import { MessageData } from '../models/message.interface';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private firestore = inject(FirestoreService);

  watchChannelMessages(channelId: string): Observable<MessageData[]> {
    return this.firestore
      .getSubcollection<MessageData>('channels', channelId, 'messages', 'createdAt')
      .pipe(
        map(msgs =>
          msgs.map(m => ({
            ...m,
            createdAt: this.toDate(m.createdAt),
            editedAt: this.toDate(m.editedAt),
          }))
        )
      );
  }

  watchConversationMessages(convId: string): Observable<MessageData[]> {
    return this.firestore
      .getSubcollection<MessageData>('conversations', convId, 'messages', 'createdAt')
      .pipe(
        map(msgs =>
          msgs.map(m => ({
            ...m,
            createdAt: this.toDate(m.createdAt),
            editedAt: this.toDate(m.editedAt),
          }))
        )
      );
  }

  async sendChannelMessage(channelId: string, text: string, senderId: string) {
    const now = new Date();
    const message: Omit<MessageData, 'id'> = {
      text,
      senderId,
      createdAt: now,
      editedAt: now,
      threadCount: 0,
      reactions: {},
    };

    await this.firestore.addDocument(`channels/${channelId}/messages`, message);
    return this.firestore.updateDocument('channels', channelId, {
      lastMessageAt: now,
    });
  }

  async sendConversationMessage(convId: string, text: string, senderId: string) {
    const now = new Date();
    const message: Omit<MessageData, 'id'> = {
      text,
      senderId,
      createdAt: now,
      editedAt: now,
      threadCount: 0,
      reactions: {},
    };

    await this.firestore.addDocument(`conversations/${convId}/messages`, message);
    return this.firestore.updateDocument('conversations', convId, {
      lastMessageAt: now,
    });
  }

  updateChannelMessage(channelId: string, messageId: string, text: string) {
    const now = new Date();
    return this.firestore.updateDocument(
      `channels/${channelId}/messages`,
      messageId,
      { text, editedAt: now }
    );
  }

  updateConversationMessage(convId: string, messageId: string, text: string) {
    const now = new Date();
    return this.firestore.updateDocument(
      `conversations/${convId}/messages`,
      messageId,
      { text, editedAt: now }
    );
  }

  updateReactions(channelId: string, messageId: string, reactions: MessageData['reactions']) {
    return this.firestore.updateDocument(
      `channels/${channelId}/messages`,
      messageId,
      { reactions }
    );
  }

  private toDate(value: any): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (value.toDate) return value.toDate();
    return new Date(value);
  }
=======
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ChannelService } from './channel.service';
import { ConversationService } from './conversation.service';
import { FirestoreService } from "./firestore";

import { MessageData } from '../models/message.interface';
import type { ReactionId } from '../../shared/data/reactions';

@Injectable({ providedIn: 'root' })

export class MessageService {
    constructor(
        private channelService: ChannelService,
        private conversationService: ConversationService,
        private firestore: FirestoreService
    ) { }

    // new 14.12.:
    deleteChannelMessage(channelId: string, messageId: string) {
        return this.firestore.deleteDocument(`channels/${channelId}/messages`, messageId);
    }

    // new 14.12.:
    deleteConversationMessage(conversationId: string, messageId: string) {
        return this.firestore.deleteDocument(`conversations/${conversationId}/messages`, messageId);
    }

    private createMessage(text: string, senderId: string, now: Date): MessageData {
        return {
            text,
            senderId,
            createdAt: now,
            editedAt: now,
            threadCount: 0,
            reactions: {},
        };
    }

    async sendToChannel(channelId: string, text: string, senderId: string): Promise<void> {
        const now = new Date();
        const message = this.createMessage(text, senderId, now);
        await this.firestore.addDocument(
            `channels/${channelId}/messages`,
            message
        );
        await this.channelService.updateChannelLastMessage(channelId, now);
    }

    async sendToConversation(conversationId: string, text: string, senderId: string): Promise<void> {
        const now = new Date();
        const message = this.createMessage(text, senderId, now);
        await this.firestore.addDocument(
            `conversations/${conversationId}/messages`,
            message
        );
        await this.conversationService.updateConversationLastMessage(conversationId, now);
    }

    updateChannelMessage(channelId: string, messageId: string, text: string): Promise<void> {
        return this.firestore.updateDocument(
            `channels/${channelId}/messages`,
            messageId,
            {
                text,
                editedAt: new Date(),
            }
        );
    }

    updateConversationMessage(conversationId: string, messageId: string, text: string): Promise<void> {
        return this.firestore.updateDocument(
            `conversations/${conversationId}/messages`,
            messageId,
            {
                text,
                editedAt: new Date(),
            }
        );
    }

    //Reactions

    private async toggleReactionForCollection(collectionPath: string, messageId: string, reactionId: ReactionId, userId: string): Promise<void> {
        const docPath = `${collectionPath}/${messageId}`;
        const message = await firstValueFrom(this.firestore.getDocument<MessageData>(docPath));
        if (!message) {
            console.warn('toggleReaction: Message not found', docPath);
            return;
        }
        const reactions = { ...(message.reactions ?? {}) };
        const currentUsers = new Set<string>(reactions[reactionId] ?? []);
        console.log(currentUsers)
        currentUsers.has(userId) ? currentUsers.delete(userId) : currentUsers.add(userId);
        currentUsers.size === 0 ? delete reactions[reactionId] : reactions[reactionId] = Array.from(currentUsers)
        await this.firestore.updateDocument(collectionPath, messageId, {
            reactions,
        });
    }

    toggleReactionOnChannelMessage(channelId: string, messageId: string, reactionId: ReactionId, userId: string): Promise<void> {
        return this.toggleReactionForCollection(
            `channels/${channelId}/messages`,
            messageId,
            reactionId,
            userId
        );
    }

    toggleReactionOnConversationMessage(conversationId: string, messageId: string, reactionId: ReactionId, userId: string): Promise<void> {
        return this.toggleReactionForCollection(
            `conversations/${conversationId}/messages`,
            messageId,
            reactionId,
            userId
        );
    }
>>>>>>> ee3eec266c2dc6cde20db4744cb51b7e99ed4fea
}
