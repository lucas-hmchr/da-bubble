import { Component, OnInit, Input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
import { Channel } from '../../../models/channel.interface';
import { MessageData } from '../../../models/message.interface';
import { getAvatarById } from '../../../../shared/data/avatars';
import { User } from '../../../models/user.model';
import { ChannelSelectionService, ViewMode } from '../../../services/channel-selection.service';

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
export class View implements OnInit {

  @Input() currentUserUid: string | null = null;

  // aktueller Channel (für Channel-Modus)
  channel?: Channel;
  editingMessage?: { id: string; text: string };
  channelMembers: User[] = [];

  // global
  allChannels: Channel[] = [];
  allUsers: User[] = [];

  /** aktueller View-Modus */
  viewMode: ViewMode = 'channel';

  /** Direktnachrichten-Partner (für DM-Modus) */
  selectedDmUser: User | null = null;

  // „Neue Nachricht“-View
  recipientInputValue = '';
  recipientSuggestions: RecipientSuggestion[] = [];
  showRecipientSuggestions = false;
  selectedRecipient: RecipientSuggestion | null = null;

  constructor(
    private firestoreService: FirestoreService,
    private channelSelection: ChannelSelectionService,
  ) {

    // Users für Members & DMs laden
    this.firestoreService.getCollection<User>('users').subscribe(users => {
      this.allUsers = users;
      this.updateChannelMembers();
      this.updateSelectedDmUser();
    });

    // auf Änderungen des Auswahl-Service reagieren
    effect(() => {
      const mode = this.channelSelection.mode();
      const channelId = this.channelSelection.activeChannelId();
      const dmUserId = this.channelSelection.activeDmUserId();

      this.viewMode = mode;

      if (mode === 'channel' && channelId) {
        this.loadChannelById(channelId);
        this.selectedDmUser = null;
      }

      if (mode === 'dm' && dmUserId) {
        this.channel = undefined;
        this.selectedRecipient = null;
        this.recipientInputValue = '';
        this.showRecipientSuggestions = false;
        this.selectedDmUser =
          this.allUsers.find(u => u.uid === dmUserId) ?? null;
      }

      if (mode === 'newMessage') {
        this.channel = undefined;
        this.selectedDmUser = null;
        this.selectedRecipient = null;
        this.recipientInputValue = '';
        this.recipientSuggestions = [];
        this.showRecipientSuggestions = false;
      }
    });
  }

  ngOnInit(): void {
    this.firestoreService.getCollection<Channel>('channels')
      .subscribe(chs => this.allChannels = chs);
  }

  // ---------- Channel-Helpers ----------

loadChannelById(channelId: string) {
  this.firestoreService
    .getDocument<Channel>(`channels/${channelId}`)
    .subscribe(ch => {
      if (!ch) {
        this.channel = undefined;
        return;
      }

      // ID wieder dranhängen
      this.channel = { ...ch, id: channelId } as Channel;

      // wir sind im Channel-Modus
      this.viewMode = 'channel';

      this.updateChannelMembers();
    });
}


  private updateChannelMembers() {
    if (!this.channel?.members || this.allUsers.length === 0) {
      this.channelMembers = [];
      return;
    }
    const memberIds = this.channel.members as string[];
    this.channelMembers = this.allUsers.filter(u => u.uid && memberIds.includes(u.uid));
  }

  getAvatarSrc(user: User): string {
    if (user.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return '/images/avatars/avatar_default.svg';
  }

  // ---------- DM-Helpers ----------

  private updateSelectedDmUser() {
    const dmUserId = this.channelSelection.activeDmUserId();
    if (!dmUserId) {
      this.selectedDmUser = null;
      return;
    }
    this.selectedDmUser = this.allUsers.find(u => u.uid === dmUserId) ?? null;
  }

  /** Conversation-ID aus currentUserUid + dmUserUid bauen */
  get currentConversationId(): string | undefined {
    if (!this.currentUserUid || !this.selectedDmUser?.uid) return undefined;
    const ids = [this.currentUserUid, this.selectedDmUser.uid].sort();
    return ids.join('_');
  }

  // ---------- Autocomplete „Neue Nachricht“ ----------

  onRecipientInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.recipientInputValue = value;
    this.selectedRecipient = null;

    const trimmed = value.trim();
    if (!trimmed) {
      this.recipientSuggestions = [];
      this.showRecipientSuggestions = false;
      return;
    }

    // #channel
    if (trimmed.startsWith('#')) {
      const q = trimmed.slice(1).toLowerCase();
      const matches = this.allChannels.filter(c =>
        (c.name ?? '').toLowerCase().includes(q)
      );
      this.recipientSuggestions = matches.map(c => ({
        type: 'channel' as const,
        id: c.id as string,
        label: `#${c.name}`,
        detail: 'Channel',
      }));
      this.showRecipientSuggestions = this.recipientSuggestions.length > 0;
      return;
    }

    // @user
    if (trimmed.startsWith('@')) {
      const q = trimmed.slice(1).toLowerCase();
      const matches = this.allUsers.filter(u =>
        (u.displayName ?? u.name ?? u.email ?? '')
          .toLowerCase()
          .includes(q)
      );
      this.recipientSuggestions = matches.map(u => ({
        type: 'user' as const,
        id: u.uid!,
        label: u.displayName ?? u.name ?? u.email ?? 'Unbekannter Nutzer',
        detail: 'Mitglied',
      }));
      this.showRecipientSuggestions = this.recipientSuggestions.length > 0;
      return;
    }

    // sonst nichts
    this.recipientSuggestions = [];
    this.showRecipientSuggestions = false;
  }

  onSelectRecipient(s: RecipientSuggestion) {
    this.selectedRecipient = s;
    this.recipientInputValue = s.label;
    this.showRecipientSuggestions = false;
    // Wichtig: hier keinen Channel / DM umschalten – das passiert
    // erst nach dem Senden der Nachricht.
  }

  // ---------- Sonstiges ----------

  onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id as string, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = undefined;
  }

  onNewMessageSent(evt: {
    contextType: 'channel' | 'conversation';
    channelId?: string;
    conversationId?: string;
  }) {
    // Wenn aus "Neue Nachricht" eine Channel-Nachricht wurde → in diesen Channel springen
    if (evt.contextType === 'channel' && evt.channelId) {
      this.channelSelection.setActiveChannelId(evt.channelId);
    }
    // Bei DM (conversation) bleiben wir einfach in der aktuellen Ansicht.
  }

  getSelectedRecipientChannel(): Channel | undefined {
    if (!this.selectedRecipient || this.selectedRecipient.type !== 'channel') {
      return undefined;
    }

    return this.allChannels.find(c => c.id === this.selectedRecipient!.id);
  }

}
