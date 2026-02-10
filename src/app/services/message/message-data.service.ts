import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ChannelService } from './../channel.service';
import { ConversationService } from './../conversation.service';
import { MessageData } from '../../models/message.interface';
import { MessageScrollService } from './message-scroll.service';

type GetBottomElementFn = () => any;

@Injectable({ providedIn: 'root' })
export class MessageDataService {
  private messageCounts = new Map<string, number>();

  constructor(
    private channelService: ChannelService,
    private conversationService: ConversationService,
    private scrollService: MessageScrollService
  ) {}

  loadChannelMessages(
    channelId: string,
    getBottomElement: GetBottomElementFn,
    isThreadContext: boolean
  ): Observable<MessageData[]> {
    const contextKey = `channel-${channelId}`;
    
    return this.channelService
      .getChannelMessages(channelId)
      .pipe(
        tap((messages) => {
          this.handleNewMessages(messages, getBottomElement, isThreadContext, contextKey);
        })
      );
  }

  loadConversationMessages(
    conversationId: string,
    getBottomElement: GetBottomElementFn,
    isThreadContext: boolean
  ): Observable<MessageData[]> {
    const contextKey = `conversation-${conversationId}`;
    
    return this.conversationService
      .getConversationMessages(conversationId)
      .pipe(
        tap((messages) => {
          this.handleNewMessages(messages, getBottomElement, isThreadContext, contextKey);
        })
      );
  }

  private handleNewMessages(
    messages: MessageData[],
    getBottomElement: GetBottomElementFn,
    isThreadContext: boolean,
    contextKey: string
  ): void {
    const currentCount = messages.length;
    const previousCount = this.messageCounts.get(contextKey);
    
    // Nur scrollen wenn es wirklich NEUE Messages gibt (Anzahl erhöht)
    // NICHT scrollen bei Reactions-Updates (gleiche Anzahl)
    if (previousCount !== undefined && currentCount > previousCount) {
      setTimeout(() => {
        const bottomElement = getBottomElement();
        this.scrollService.scrollToBottom(bottomElement, isThreadContext);
      }, 100);
    }
    
    this.messageCounts.set(contextKey, currentCount);
  }

  resetMessageCount(contextKey: string): void {
    this.messageCounts.delete(contextKey);
  }

  clearAllCounts(): void {
    this.messageCounts.clear();
  }
}