import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FirestoreService } from './firestore';
import { MessageData } from '../models/message.interface';
import { Channel } from '../models/channel.interface';
import { ChannelStoreService } from './channel-store.service';

export interface ThreadContext {
  type: 'channel' | 'conversation';
  id: string;
  parentMessageId: string;
}

@Injectable({ providedIn: 'root' })
export class ThreadService {
  private firestore = inject(FirestoreService);
  private channelStore = inject(ChannelStoreService);

  // State
  private _isOpen = signal(false);
  private _parentMessage = signal<MessageData | null>(null);
  private _contextType = signal<'channel' | 'conversation'>('channel');
  private _contextId = signal<string | null>(null);
  private _threadMessages = signal<MessageData[]>([]);

  // Subscription für Thread-Messages
  private threadMessagesSub?: Subscription;
  private parentMessageSub?: Subscription;

  // Public readonly signals
  readonly isOpen = this._isOpen.asReadonly();
  readonly parentMessage = this._parentMessage.asReadonly();
  readonly contextType = this._contextType.asReadonly();
  readonly contextId = this._contextId.asReadonly();
  readonly threadMessages = this._threadMessages.asReadonly();

  // Computed: Channel-Name für Header
  readonly channelName = computed(() => {
    const type = this._contextType();
    const id = this._contextId();

    if (type === 'channel' && id) {
      const channel = this.channelStore.getById(id);
      return channel?.name ?? 'Channel';
    }

    return 'Direktnachricht';
  });

  /**
   * Thread öffnen
   */
  open(
    contextType: 'channel' | 'conversation',
    contextId: string,
    parentMessage: MessageData
  ) {
    if (!parentMessage.id) {
      console.warn('Thread: Parent message has no ID');
      return;
    }

    // State setzen
    this._isOpen.set(true);
    this._contextType.set(contextType);
    this._contextId.set(contextId);
    // this._parentMessage.set(parentMessage);
    this.subscribeToParentMessage(contextType, contextId, parentMessage.id);

    // Thread-Messages laden
    this.subscribeToThreadMessages(contextType, contextId, parentMessage.id);
  }

  /**
   * Thread schließen
   */
  close() {
    this._isOpen.set(false);
    this._parentMessage.set(null);
    this._contextId.set(null);
    this._threadMessages.set([]);

    // Subscription cleanup
    this.threadMessagesSub?.unsubscribe();
    this.threadMessagesSub = undefined;
    this.parentMessageSub?.unsubscribe();
    this.parentMessageSub = undefined;
  }

  /**
   * Thread-Messages subscriben
   */
  private subscribeToThreadMessages(
    contextType: 'channel' | 'conversation',
    contextId: string,
    parentMessageId: string
  ) {
    // Alte Subscription aufräumen
    this.threadMessagesSub?.unsubscribe();

    // Neue Subscription
    const messages$ = this.getThreadMessages(contextType, contextId, parentMessageId);

    this.threadMessagesSub = messages$.subscribe((msgs) => {
      this._threadMessages.set(msgs);
    });
  }

  private subscribeToParentMessage(
    contextType: 'channel' | 'conversation',
    contextId: string,
    parentMessageId: string
  ) {
    this.parentMessageSub?.unsubscribe();

    const docPath = contextType === 'channel'
      ? `channels/${contextId}/messages/${parentMessageId}`
      : `conversations/${contextId}/messages/${parentMessageId}`;

    const parentMessage$ = this.firestore.getDocument<MessageData>(docPath);

    this.parentMessageSub = parentMessage$.subscribe((msg) => {
      if (msg) {
        if (!msg.id) {
          msg.id = parentMessageId;
        }
        this._parentMessage.set(msg);
      } else {
        this.close();
      }
    });
  }

  /**
   * Thread-Messages Observable
   */
  private getThreadMessages(
    contextType: 'channel' | 'conversation',
    contextId: string,
    parentMessageId: string
  ): Observable<MessageData[]> {

    const parentPath = contextType === 'channel' ? 'channels' : 'conversations';
    const subcollectionPath = `messages/${parentMessageId}/threadMessages`;

    // ========== DEBUG ==========
    console.log('🔍 Thread: Loading messages from:');
    console.log('Parent Path:', parentPath);
    console.log('Parent ID:', contextId);
    console.log('Subcollection:', subcollectionPath);
    console.log('Full Path:', `${parentPath}/${contextId}/${subcollectionPath}`);
    // ===========================

    return this.firestore.getSubcollection<MessageData>(
      parentPath,
      contextId,
      subcollectionPath,
      'createdAt'
    );
  }

  /**
   * Thread-Message senden
   */
  async sendThreadMessage(text: string, senderId: string): Promise<void> {
    const contextType = this._contextType();
    const contextId = this._contextId();
    const parentMsg = this._parentMessage();

    if (!contextId || !parentMsg?.id) {
      console.warn('Thread: Cannot send message - thread not open');
      return;
    }

    const now = new Date();
    const message: MessageData = {
      text,
      senderId,
      createdAt: now,
      editedAt: now,
      threadCount: 0,
      reactions: {},
    };

    const path = contextType === 'channel'
      ? `channels/${contextId}/messages/${parentMsg.id}/threadMessages`
      : `conversations/${contextId}/messages/${parentMsg.id}/threadMessages`;

    try {
      // Message hinzufügen
      await this.firestore.addDocument(path, message);

      // Parent-Message threadCount & lastReplyAt aktualisieren
      await this.updateParentMessage(contextType, contextId, parentMsg.id);
    } catch (error) {
      console.error('Thread: Error sending message', error);
      throw error;
    }
  }

  /**
   * Parent-Message aktualisieren (threadCount + lastReplyAt)
   */
  private async updateParentMessage(
    contextType: 'channel' | 'conversation',
    contextId: string,
    parentMessageId: string
  ): Promise<void> {
    const currentCount = this._parentMessage()?.threadCount ?? 0;
    const newCount = currentCount + 1;

    const basePath = contextType === 'channel'
      ? `channels/${contextId}/messages`
      : `conversations/${contextId}/messages`;

    await this.firestore.updateDocument(basePath, parentMessageId, {
      threadCount: newCount,
      lastReplyAt: new Date(),
    });

  }

  ngOnDestroy() {
    this.parentMessageSub?.unsubscribe();  // ← NEU
    this.threadMessagesSub?.unsubscribe();
  }
}