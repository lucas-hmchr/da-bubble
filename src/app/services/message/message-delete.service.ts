import { Injectable } from '@angular/core';
import { MessageData } from '../models/message.interface';
import { MessageService } from './message.service';

@Injectable({ providedIn: 'root' })
export class MessageDeleteService {
  
  constructor(private messageService: MessageService) {}

  async deleteMessage(
    msg: MessageData,
    contextType: 'channel' | 'conversation' | 'thread',
    contextId: string,
    isThreadContext: boolean,
    threadParentMessageId?: string
  ): Promise<void> {
    if (isThreadContext && threadParentMessageId) {
      await this.deleteThreadMessage(
        msg.id!,
        contextType,
        contextId,
        threadParentMessageId
      );
    } else if (contextType === 'channel') {
      await this.messageService.deleteChannelMessage(contextId, msg.id!);
    } else if (contextType === 'conversation') {
      await this.messageService.deleteConversationMessage(contextId, msg.id!);
    }
  }

  private async deleteThreadMessage(
    messageId: string,
    contextType: 'channel' | 'conversation' | 'thread',
    contextId: string,
    parentMessageId: string
  ): Promise<void> {
    if (contextType === 'channel') {
      await this.messageService.deleteThreadMessage(
        'channel',
        contextId,
        parentMessageId,
        messageId
      );
    } else if (contextType === 'conversation') {
      await this.messageService.deleteThreadMessage(
        'conversation',
        contextId,
        parentMessageId,
        messageId
      );
    }
  }

  confirmThreadDeletion(msg: MessageData, isThreadContext: boolean): boolean {
    if (isThreadContext) return true;
    if (msg.threadCount && msg.threadCount > 0) {
      return window.confirm(
        `Diese Nachricht hat ${msg.threadCount} Antwort(en).\n\n` +
        `Soll die Nachricht samt allen Antworten gelöscht werden?`
      );
    }
    return true;
  }
}