import { Component, EventEmitter, Input, Output, effect, inject, signal } from '@angular/core';
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
import { NewMessageService } from '../../../services/message/new-message.service';
import { ViewStateService } from '../../../services/view-state.service';
import { ProfilePopup } from '../../shared/profile-popup/profile-popup';
import { ProfilePopupService } from '../../../services/profile-popup.service';
import { AddMemberPopup } from "./add-member-popup/add-member-popup";
import { ThreadService } from '../../../services/thread.service';
import { ChannelInfoService } from '../../../services/channel-info.service';

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
  imports: [CommonModule, MessageInput, Message, ProfilePopup, AddMemberPopup],
  templateUrl: './view.html',
  styleUrls: ['./view.scss'],
})
export class View {
  public newMessage = inject(NewMessageService);
  public viewState = inject(ViewStateService);
  private threadService = inject(ThreadService);
  private channelInfoService = inject(ChannelInfoService);
  @Input() currentUserUid: string | null = null;

  contextType: ChatContextType = 'channel';
  editingMessage: { id: string; text: string } | null = null;
  threadOpen = false;
  threadChannelId: string | null = null;
  threadParentMessage: MessageData | null = null;

  recipientInputValue = '';
  recipientSuggestions: RecipientSuggestion[] = [];
  showRecipientSuggestions = false;
  selectedRecipient: RecipientSuggestion | null = null;

  showChannelMemberList = signal<Boolean>(false);
  showAddChannelMemberPopup = signal<Boolean>(false);
  @Output() openThread = new EventEmitter<MessageData>();

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

  getAvatarSrc(user: User): string {
    if (user.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return 'images/avatars/avatar_default.svg';
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

  toggleAddChannelMemberPopup() {
    this.showAddChannelMemberPopup.set(!this.showAddChannelMemberPopup())
  }

  openAddingPopupFromMemberList() {
    this.showChannelMemberList.set(false);
    this.showAddChannelMemberPopup.set(true);
  }


  onThreadRequested(msg: MessageData) {
    const contextType = this.contextType;
    let threadContextType: 'channel' | 'conversation';
    let contextId: string | null = null;

    if (contextType === 'channel') {
      threadContextType = 'channel';
      contextId = this.channel?.id ?? null;
    } else if (contextType === 'dm') {
      threadContextType = 'conversation';
      contextId = this.dmConversationId;
    } else {
      return;
    }

    if (!contextId) {
      return;
    }

    this.threadService.open(threadContextType, contextId, msg);

    this.threadOpen = false;
    this.threadChannelId = null;
    this.threadParentMessage = null;
    this.openThread.emit(msg);
  }

  closeThread() {
    this.threadService.close();

    this.threadOpen = false;
    this.threadChannelId = null;
    this.threadParentMessage = null;
  }

  openChannelInfo() {
    if (this.channel) {
      this.channelInfoService.open(this.channel);
    }
  }

}