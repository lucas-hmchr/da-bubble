import { Component, Input, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
import { Channel } from '../../../models/channel.interface';
import { MessageData } from '../../../models/message.interface';
import { getAvatarById } from '../../../../shared/data/avatars';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import {
  ChatContextService,
  ChatContextType,
} from '../../../services/chat-context.service';
import { ChannelService } from '../../../services/channel.service';
import { ConversationService } from '../../../services/conversation.service';
import { NewMessageService } from '../../../services/new-message.service';
import { ViewStateService } from '../../../services/view-state.service';
import { ProfilePopup } from '../../shared/profile-popup/profile-popup';
import { ProfilePopupService } from '../../../services/profile-popup.service';

type RecipientType = 'channel' | 'user' | null;

interface RecipientSuggestion {
  type: RecipientType;
  id: string;
  label: string;
  detail?: string;
}

/** Event-Payload aus <app-message> wenn Answer/Thread geklickt wurde */
type ThreadRequest = { channelId: string; message: MessageData };

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [CommonModule, MessageInput, Message, ProfilePopup],
  templateUrl: './view.html',
  styleUrls: ['./view.scss'],
})
export class View {
  public newMessage = inject(NewMessageService);
  public viewState = inject(ViewStateService);

  @Input() currentUserUid: string | null = null;

  contextType: ChatContextType = 'channel';
  editingMessage: { id: string; text: string } | null = null;

  recipientInputValue = '';
  recipientSuggestions: RecipientSuggestion[] = [];
  showRecipientSuggestions = false;
  selectedRecipient: RecipientSuggestion | null = null;

  showChannelMemberList = signal<Boolean>(false);

  // =========================================================
  // THREAD STATE (rechts im Panel)
  // =========================================================
  private _threadOpen = signal<boolean>(false);
  private _threadChannelId = signal<string | null>(null);
  private _threadParentMessage = signal<MessageData | null>(null);

  /** Template-API */
  threadOpen = () => this._threadOpen();
  threadChannelId = () => this._threadChannelId();
  threadParentMessage = () => this._threadParentMessage();

  constructor(
    private firestore: FirestoreService,
    private channelService: ChannelService,
    private conversationService: ConversationService,
    private chatContext: ChatContextService,
    public userService: UserService,
    private profilePopupService: ProfilePopupService
  ) {
    effect(() => {
      const type = this.chatContext.contextType();
      const channelId = this.chatContext.channelId();
      const convId = this.chatContext.convId();

      this.showChannelMemberList.set(false);
      this.contextType = type;

      // Wichtig: Thread schließen, wenn wir den Kontext wechseln
      // (DM / New / anderer Channel)
      if (type !== 'channel') {
        this.closeThread();
      }

      if (type === 'channel' && channelId) {
        this.channelService.subscribeSelectedChannel(channelId);
        this.conversationService.cleanup();
        this.resetNewMessageState();

        // Thread ebenfalls schließen, wenn Channel wechselt
        // (keine "hängenden" Threads)
        this.closeThread();
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

  // =========================================================
  // GETTERS (Channel / DM)
  // =========================================================

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

  get isChannelEmpty(): boolean {
    return this.channelService.isActiveChannelEmpty();
  }

  dmLoaded(): boolean {
    return this.conversationService.dmLoaded();
  }

  // =========================================================
  // THREAD API (wird aus message.html per Output aufgerufen)
  // =========================================================

  /** Wird aufgerufen, wenn in einer Channel-Message Answer/Thread geklickt wurde */
  openThread(req: ThreadRequest) {
    // Nur im Channel sinnvoll
    if (this.contextType !== 'channel') return;

    this._threadChannelId.set(req.channelId);
    this._threadParentMessage.set(req.message);
    this._threadOpen.set(true);
  }

  closeThread() {
    this._threadOpen.set(false);
    this._threadChannelId.set(null);
    this._threadParentMessage.set(null);
  }

  // =========================================================
  // UI HELPERS
  // =========================================================

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
      // Hinweis: hier wird noch die conversationId übergeben (nicht Partner-UID).
      // Falls euer ChatContext dafür openConversationByConvId hat, wäre das korrekt.
      this.chatContext.openConversation(evt.conversationId);
    }
  }

  getSelectedRecipientChannel(): Channel | undefined {
    if (!this.selectedRecipient || this.selectedRecipient.type !== 'channel') {
      return undefined;
    }
    return this.allChannels.find((c) => c.id === this.selectedRecipient!.id);
  }

  onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = null;
  }

  onNewMessageToKeyup(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    this.newMessage.setQuery(input.value);
  }

  toggleChannelMemberList() {
    this.showChannelMemberList.set(!this.showChannelMemberList());
  }

  openProfile(uid: string) {
    this.profilePopupService.open(uid);
  }
}
