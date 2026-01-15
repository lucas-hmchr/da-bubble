import { Injectable } from '@angular/core';
import { MessageInputService } from './message-intput.service';

export interface SendContext {
  contextType: 'channel' | 'conversation';
  channelId?: string;
  conversationId?: string;
}

@Injectable({ providedIn: 'root' })
export class MessageInputSendService {
  
  constructor(private messageInputService: MessageInputService) {}

  async sendByContext(
    text: string,
    senderId: string,
    contextType: 'channel' | 'conversation',
    channelId: string | undefined,
    conversationId: string | undefined,
    isEditing: boolean,
    editingMessageId?: string
  ): Promise<SendContext> {
    if (contextType === 'channel') {
      const id = await this.handleChannelSend(
        text,
        senderId,
        channelId,
        isEditing,
        editingMessageId
      );
      return { contextType: 'channel', channelId: id };
    } else {
      const id = await this.handleConversationSend(
        text,
        senderId,
        conversationId,
        isEditing,
        editingMessageId
      );
      return { contextType: 'conversation', conversationId: id };
    }
  }

  private async handleChannelSend(
    text: string,
    senderId: string,
    channelId: string | undefined,
    isEditing: boolean,
    editingMessageId?: string
  ): Promise<string> {
    if (!channelId) {
      return '';
    }

    if (isEditing && editingMessageId) {
      await this.messageInputService.updateChannelMessage(
        channelId,
        editingMessageId,
        text
      );
    } else {
      await this.messageInputService.sendChannelMessage(
        channelId,
        text,
        senderId
      );
    }
    return channelId;
  }

  private async handleConversationSend(
    text: string,
    senderId: string,
    conversationId: string | undefined | null,
    isEditing: boolean,
    editingMessageId?: string
  ): Promise<string> {
    if (!conversationId) {
      return '';
    }

    if (isEditing && editingMessageId) {
      await this.messageInputService.updateConversationMessage(
        conversationId,
        editingMessageId,
        text
      );
    } else {
      await this.messageInputService.sendConversationMessage(
        conversationId,
        text,
        senderId
      );
    }
    return conversationId;
  }
}