import { Injectable } from '@angular/core';
import { FirestoreService } from './../firestore';
import { User } from '../../models/user.model';
import { Channel } from '../../models/channel.interface';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MessageInputService {
  constructor(private firestore: FirestoreService) { }

  loadUsers(): Observable<User[]> {
    return this.firestore.getCollection<User>('users');
  }

  loadChannels(): Observable<Channel[]> {
    return this.firestore.getCollection<Channel>('channels');
  }

  private createMessage(text: string, senderId: string, now: Date) {
    return {
      text,
      senderId,
      createdAt: now,
      editedAt: now,
      threadCount: 0,
      reactions: {},
    };
  }

  async sendChannelMessage(channelId: string, text: string, senderId: string) {
    const now = new Date();
    const message = this.createMessage(text, senderId, now);

    await this.firestore.addDocument(
      `channels/${channelId}/messages`,
      message
    );

    return this.firestore.updateDocument('channels', channelId, {
      lastMessageAt: now,
    });
  }

  async sendConversationMessage(convId: string, text: string, senderId: string) {
    const now = new Date();
    const message = this.createMessage(text, senderId, now);

    await this.firestore.addDocument(
      `conversations/${convId}/messages`,
      message
    );

    return this.firestore.updateDocument('conversations', convId, {
      lastMessageAt: now,
    });
  }

  private getTriggerQuery(value: string, trigger: string): string | null {
    const lastIndex = value.lastIndexOf(trigger);
    if (lastIndex === -1) return null;

    const after = value.slice(lastIndex + 1);
    const spaceIndex = after.search(/\s/);

    return spaceIndex === -1 ? after : after.slice(0, spaceIndex);
  }

  filterUsersByQuery(users: User[], value: string): User[] | null {
    const query = this.getTriggerQuery(value, '@');
    if (!query) return null;

    const q = query.toLowerCase();
    return users.filter((u) =>
      (u.displayName ?? u.name ?? '').toLowerCase().includes(q)
    );
  }

  filterChannelsByQuery(
    channels: Channel[],
    value: string
  ): Channel[] | null {
    const query = this.getTriggerQuery(value, '#');
    if (!query) return null;

    const q = query.toLowerCase();
    return channels.filter((c) =>
      (c.name ?? '').toLowerCase().includes(q)
    );
  }

  async updateChannelMessage(
    channelId: string,
    messageId: string,
    text: string
  ) {
    const now = new Date();

    return this.firestore.updateDocument(
      `channels/${channelId}/messages`,
      messageId,
      {
        text,
        editedAt: now,
      }
    );
  }

  async updateConversationMessage(
    convId: string,
    messageId: string,
    text: string
  ) {
    const now = new Date();

    return this.firestore.updateDocument(
      `conversations/${convId}/messages`,
      messageId,
      {
        text,
        editedAt: now,
      }
    );
  }

  async updateThreadMessage(
    contextType: 'channel' | 'conversation',
    contextId: string,
    parentMessageId: string,
    threadMessageId: string,
    text: string
  ) {
    const now = new Date();

    const basePath = contextType === 'channel'
      ? `channels/${contextId}/messages`
      : `conversations/${contextId}/messages`;

    const threadPath = `${basePath}/${parentMessageId}/threadMessages`;

    return this.firestore.updateDocument(
      threadPath,
      threadMessageId,
      {
        text,
        editedAt: now,
      }
    );
  }

}
