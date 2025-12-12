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
}
