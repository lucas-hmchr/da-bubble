import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ChannelService } from './channel.service';
import { ConversationService } from './conversation.service';
import { MessageData } from '../models/message.interface';
import { MessageScrollService } from './message-scroll.service';
import { ElementRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MessageDataService {
  private previousMessageCount?: number;

  constructor(
    private channelService: ChannelService,
    private conversationService: ConversationService,
    private scrollService: MessageScrollService
  ) {}

  loadChannelMessages(
    channelId: string,
    bottomElement?: ElementRef<HTMLDivElement>
  ): Observable<MessageData[]> {
    return this.channelService
      .getChannelMessages(channelId)
      .pipe(
        tap((messages) => {
          this.handleNewMessages(messages, bottomElement);
        })
      );
  }

  loadConversationMessages(
    conversationId: string,
    bottomElement?: ElementRef<HTMLDivElement>
  ): Observable<MessageData[]> {
    return this.conversationService
      .getConversationMessages(conversationId)
      .pipe(
        tap(() => {
          setTimeout(() => this.scrollService.scrollToBottom(bottomElement), 100);
        })
      );
  }

  private handleNewMessages(
    messages: MessageData[],
    bottomElement?: ElementRef<HTMLDivElement>
  ): void {
    const previousCount = this.previousMessageCount || 0;
    this.previousMessageCount = messages.length;
    if (messages.length > previousCount) {
      setTimeout(() => this.scrollService.scrollToBottom(bottomElement), 100);
    }
  }

  resetMessageCount(): void {
    this.previousMessageCount = undefined;
  }
}