import { Component, OnInit, Input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
import { Channel } from '../../../models/channel.interface';
import { MessageData } from '../../../models/message.interface';
import { getAvatarById } from '../../../../shared/data/avatars';
import { User } from '../../../models/user.model';
import { ChannelSelectionService } from '../../../services/channel-selection.service';

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


  channel?: Channel;
  @Input() currentUserUid: string | null = null;
  editingMessage?: { id: string; text: string };

  // Modus
  isNewMessageView = false;

  // Daten für Autocomplete
  allChannels: Channel[] = [];
  allUsers: User[] = [];
  channelMembers: User[] = [];

  recipientInputValue = '';
  recipientSuggestions: RecipientSuggestion[] = [];
  showRecipientSuggestions = false;
  selectedRecipient: RecipientSuggestion | null = null;

  constructor(
    private firestoreService: FirestoreService,
    private channelSelection: ChannelSelectionService
  ) {

    this.firestoreService.getCollection<User>('users').subscribe(users => {
      this.allUsers = users;
      this.updateChannelMembers();   // falls der Channel schon da ist
    });
    // auf Mode + activeChannelId reagieren
    effect(() => {
      const mode = this.channelSelection.mode();
      const channelId = this.channelSelection.activeChannelId();

      this.isNewMessageView = mode === 'newMessage';

      if (mode === 'channel' && channelId) {
        this.loadChannelById(channelId);
      }

      if (mode === 'newMessage') {
        this.channel = undefined;
        this.selectedRecipient = null;
        this.recipientInputValue = '';
        this.recipientSuggestions = [];
        this.showRecipientSuggestions = false;
      }
    });
  }

  private updateChannelMembers() {
    if (!this.channel?.members || this.allUsers.length === 0) {
      this.channelMembers = [];
      return;
    }

    const memberIds = this.channel.members as string[]; // Feld in deinem Channel-Model

    this.channelMembers = this.allUsers.filter(u =>
      u.uid && memberIds.includes(u.uid)
    );
  }


  ngOnInit(): void {
    // alle Channels laden (für Autocomplete)
    this.firestoreService.getCollection<Channel>('channels').subscribe(chs => {
      this.allChannels = chs;
    });

    // alle User laden (für Autocomplete)
    this.firestoreService.getCollection<User>('users').subscribe(users => {
      this.allUsers = users;
    });
  }

  loadChannelById(channelId: string) {
    this.firestoreService
      .getDocument<Channel>(`channels/${channelId}`)
      .subscribe(ch => {
        this.channel = ch;
        // HIER ergänzen:
        this.updateChannelMembers();
      });
  }


  // --------- Autocomplete „An:“ ---------

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
        type: 'channel',
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
        type: 'user',
        id: u.uid!,
        label: u.displayName ?? u.name ?? u.email ?? 'Unbekannter Nutzer',
        detail: 'Mitglied',
      }));
      this.showRecipientSuggestions = this.recipientSuggestions.length > 0;
      return;
    }

    // sonst (z.B. E-Mail): hier könnt ihr später erweitern
    this.recipientSuggestions = [];
    this.showRecipientSuggestions = false;
  }

  onSelectRecipient(s: RecipientSuggestion) {
    this.selectedRecipient = s;
    this.recipientInputValue = s.label;
    this.showRecipientSuggestions = false;

    if (s.type === 'channel') {
      // wir können direkt in den Channel-Modus springen
      this.channelSelection.setMode('channel');
      this.channelSelection.setActiveChannelId(s.id);
    }

    // bei 'user' könntet ihr später eine Conversation öffnen/erstellen
  }

  onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id as string, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = undefined;
  }

  getAvatarSrc(user: User): string {
  // falls avatarId vorhanden → aus dem Avatar-Config holen
  if (user.avatarId) {
    return getAvatarById(user.avatarId).src;
  }

  // Fallback, wenn etwas fehlt
  return '/images/avatars/avatar_default.svg';
}

}
