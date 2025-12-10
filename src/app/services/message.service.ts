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
}
