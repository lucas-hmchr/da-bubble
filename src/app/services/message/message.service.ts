import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ChannelService } from './../channel.service';
import { ConversationService } from './../conversation.service';
import { FirestoreService } from "./../firestore";

import { MessageData } from '../../models/message.interface';
import type { ReactionId } from '../../../shared/data/reactions';

@Injectable({ providedIn: 'root' })

export class MessageService {
    constructor(
        private channelService: ChannelService,
        private conversationService: ConversationService,
        private firestore: FirestoreService
    ) { }

    async deleteChannelMessage(channelId: string, messageId: string): Promise<void> {
        try {
            const threadMessagesPath = `channels/${channelId}/messages/${messageId}/threadMessages`;
            const threadMessages = await firstValueFrom(
                this.firestore.getCollection<MessageData>(threadMessagesPath)
            );

            for (const threadMsg of threadMessages) {
                if (threadMsg.id) {
                    await this.firestore.deleteDocument(threadMessagesPath, threadMsg.id);
                }
            }

        } catch (error) {
        }

        return this.firestore.deleteDocument(`channels/${channelId}/messages`, messageId);
    }

    async deleteConversationMessage(conversationId: string, messageId: string): Promise<void> {
        try {
            const threadMessagesPath = `conversations/${conversationId}/messages/${messageId}/threadMessages`;
            const threadMessages = await firstValueFrom(
                this.firestore.getCollection<MessageData>(threadMessagesPath)
            );

            for (const threadMsg of threadMessages) {
                if (threadMsg.id) {
                    await this.firestore.deleteDocument(threadMessagesPath, threadMsg.id);
                }
            }

        } catch (error) {
        }

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

    private async toggleReactionForCollection(collectionPath: string, messageId: string, reactionId: ReactionId, userId: string): Promise<void> {
        const docPath = `${collectionPath}/${messageId}`;
        const message = await firstValueFrom(this.firestore.getDocument<MessageData>(docPath));
        if (!message) {
            return;
        }
        const reactions = { ...(message.reactions ?? {}) };
        const currentUsers = new Set<string>(reactions[reactionId] ?? []);
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

    async deleteThreadMessage(
        contextType: 'channel' | 'conversation',
        contextId: string,
        parentMessageId: string,
        threadMessageId: string
    ): Promise<void> {
        const basePath = contextType === 'channel'
            ? `channels/${contextId}/messages`
            : `conversations/${contextId}/messages`;

        const threadPath = `${basePath}/${parentMessageId}/threadMessages`;

        await this.firestore.deleteDocument(threadPath, threadMessageId);

        const parentDoc = await firstValueFrom(
            this.firestore.getDocument<MessageData>(`${basePath}/${parentMessageId}`)
        );

        if (!parentDoc) {
            return;
        }

        const currentCount = parentDoc.threadCount ?? 0;
        const newCount = Math.max(0, currentCount - 1);

        await this.firestore.updateDocument(basePath, parentMessageId, {
            threadCount: newCount,
        });

    }

    toggleReactionOnThreadMessage(
        contextType: 'channel' | 'conversation',
        contextId: string,
        parentMessageId: string,
        threadMessageId: string,
        reactionId: ReactionId,
        userId: string
    ): Promise<void> {
        const basePath = contextType === 'channel'
            ? `channels/${contextId}/messages`
            : `conversations/${contextId}/messages`;

        const threadPath = `${basePath}/${parentMessageId}/threadMessages`;

        return this.toggleReactionForCollection(
            threadPath,
            threadMessageId,
            reactionId,
            userId
        );
    }
}
