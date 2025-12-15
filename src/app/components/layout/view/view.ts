import { Component, Input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
import { Channel } from '../../../models/channel.interface';
import { MessageData } from '../../../models/message.interface';
import { getAvatarById } from '../../../../shared/data/avatars';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { ChatContextService, ChatContextType } from '../../../services/chat-context.service';
import { ChannelService } from '../../../services/channel.service';
import { ConversationService } from '../../../services/conversation.service';

type RecipientType = 'channel' | 'user' | null;

interface RecipientSuggestion {
  type: RecipientType;
  id: string;
  label: string;
  detail?: string;
}

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [CommonModule, MessageInput, Message],
  templateUrl: './view.html',
  styleUrls: ['./view.scss'],
})
export class View {

  @Input() currentUserUid: string | null = null;
  contextType: ChatContextType = 'channel';
  editingMessage: { id: string; text: string } | null = null;

  recipientInputValue = '';
  recipientSuggestions: RecipientSuggestion[] = [];
  showRecipientSuggestions = false;
  selectedRecipient: RecipientSuggestion | null = null;

  constructor(
    private firestore: FirestoreService,
    private channelService: ChannelService,
    private conversationService: ConversationService,
    private chatContext: ChatContextService,
    public userService: UserService,
  ) {

    effect(() => {
      const type = this.chatContext.contextType();
      const channelId = this.chatContext.channelId();
      const convId = this.chatContext.convId();

      this.contextType = type;

      if (type === 'channel' && channelId) {
        this.channelService.subscribeSelectedChannel(channelId);
        this.conversationService.cleanup();
        this.resetNewMessageState();
      } else if (type === 'dm' && convId) {
        this.conversationService.subscribeToConversation(convId);
        this.resetNewMessageState();
      } else if (type === 'new') {
        this.conversationService.cleanup();
        this.channelService.cleanUp();
        this.resetNewMessageState();
      }
    });
  }

  get channel(): Channel | null {
    return this.channelService.activeChannel();
  }

  get channelMessages(): MessageData[] {
    return this.channelService.activeChannelMessages();
  }

  get channelMembers(): User[] {
    return this.channelService.channelMembers();
  }

  get allChannels(): Channel[] {
    return this.channelService.channels();
  }

  get allUsers(): User[] {
    return this.firestore.userList();
  }

  get dmMessages(): MessageData[] {
    return this.conversationService.activeConversationMessages();
  }

  get dmPartner(): User | null {
    return this.conversationService.activeConversationPartner();
  }

  get dmConversationId(): string | null {
    return this.conversationService.activeConversationId();
  }

  getAvatarSrc(user: User): string {
    if (user.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return '/images/avatars/avatar_default.svg';
  }

  private resetNewMessageState() {
    this.recipientInputValue = '';
    this.recipientSuggestions = [];
    this.showRecipientSuggestions = false;
    this.selectedRecipient = null;
  }

  onNewMessageSent(evt: {
    contextType: 'channel' | 'conversation';
    channelId?: string;
    conversationId?: string;
  }) {
    if (evt.contextType === 'channel' && evt.channelId) {
      this.chatContext.openChannel(evt.channelId);
    }

    if (evt.contextType === 'conversation' && evt.conversationId) {
      // hier wird noch die conversation id statt der id des other Users übergeben - allgemeine anpassung der funktion? 
      this.chatContext.openConversation(evt.conversationId);
    }
  }

  getSelectedRecipientChannel(): Channel | undefined {
    if (!this.selectedRecipient || this.selectedRecipient.type !== 'channel') {
      return undefined;
    }
    return this.allChannels.find(c => c.id === this.selectedRecipient!.id);
  }

  // onEditRequested(payload: { id: string; text: string }) {
  //   this.editingMessage = payload;
  // }

  onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = null;
  }
}
