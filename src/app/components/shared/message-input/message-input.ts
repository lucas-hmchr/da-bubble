import { Component, Input, ElementRef, ViewChild, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel.interface';
import { FirestoreService } from '../../../services/firestore'; // Pfad anpassen
import { User } from '../../../models/user.model';
import { AvatarId, getAvatarById } from '../../../../shared/data/avatars';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput {
  @Input() channel?: Channel;
  @Input() currentUserUid: string | null = null;
  @Input() contextType: 'channel' | 'conversation' = 'channel';
  @Input() conversationId?: string;

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  // users = [
  //   'Frederick Beck (Du)',
  //   'Sofia Müller',
  //   'Noah Braun',
  //   'Elise Roth',
  //   'Elias Neumann',
  //   'Steffen Hoffmann',
  // ];

  users: User[] = [];
  filteredUsers: User[] = [];
  channelsList: Channel[] = [];
  filteredChannels: Channel[] = [];

  activeMentionType: 'user' | 'channel' | null = null;

  // filteredUsers = [...this.users];

  showMentions = false;
  mentionPosition = { top: 0, left: 0, bottom: 0 };


  constructor(private firestoreService: FirestoreService) { }

  ngOnInit(): void {
    // Users
    this.firestoreService.getCollection<User>('users').subscribe((users) => {
      this.users = users;
      this.filteredUsers = users;
    });

    // Channels
    this.firestoreService.getCollection<Channel>('channels').subscribe((channels) => {
      this.channelsList = channels;
      this.filteredChannels = channels;
    });
  }

  getAvatarSrc(id: AvatarId) {
    return getAvatarById(id).src;
  }

  onKeyup(event: KeyboardEvent | Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    const lastChar = value.slice(-1);

    // --- Trigger erkennen ---

    if (lastChar === '@') {
      this.activeMentionType = 'user';
      this.showMentions = true;
      this.filteredUsers = this.users;
      this.updateMentionPosition();
      return;
    }

    if (lastChar === '#') {
      this.activeMentionType = 'channel';
      this.showMentions = true;
      this.filteredChannels = this.channelsList;
      this.updateMentionPosition();
      return;
    }

    // Wenn kein Dropdown offen ist → fertig
    if (!this.showMentions || !this.activeMentionType) return;

    // Position des Dropdowns aktualisieren, falls Cursor sich bewegt
    this.updateMentionPosition();

    // --- Filter je nach aktivem Typ ---

    if (this.activeMentionType === 'user') {
      const mentionQuery = this.getCurrentTriggerQuery(value, '@');

      if (!mentionQuery) {
        this.showMentions = false;
        this.activeMentionType = null;
        return;
      }

      const q = mentionQuery.toLowerCase();
      this.filteredUsers = this.users.filter((u) =>
        (u.displayName ?? u.name ?? '').toLowerCase().includes(q)
      );
    }

    if (this.activeMentionType === 'channel') {
      const mentionQuery = this.getCurrentTriggerQuery(value, '#');

      if (!mentionQuery) {
        this.showMentions = false;
        this.activeMentionType = null;
        return;
      }

      const q = mentionQuery.toLowerCase();
      this.filteredChannels = this.channelsList.filter((c) =>
        (c.name ?? '').toLowerCase().includes(q)
      );
    }
  }


  onEnter(event: KeyboardEvent | Event) {
    if ((event as KeyboardEvent).shiftKey) {
      return;
    }

    event.preventDefault();
    this.onSend();
  }

  async onSend() {
    const textarea = this.messageInput.nativeElement;
    const text = textarea.value.trim();

    // 1. Nichts senden, wenn leer
    if (!text) {
      return;
    }

    if (!this.currentUserUid) {
      console.warn('Kein aktueller Benutzer (UID) – Nachricht wird nicht gesendet.');
      return;
    }

    const now = new Date(); // optional: später serverTimestamp() in FirestoreService nutzen

    try {
      if (this.contextType === 'channel') {
        // --- CHANNEL ---
        if (!this.channel?.id) {
          console.warn('Kein Channel gesetzt – Nachricht wird nicht gesendet.');
          return;
        }

        const channelId = this.channel.id as string;

        // Nachricht in channels/{channelId}/messages
        await this.firestoreService.addDocument(
          `channels/${channelId}/messages`,
          {
            text,
            senderId: this.currentUserUid,
            createdAt: now,
            editedAt: now,
            threadCount: 0,
            reactions: {
              emojiName: '',
              senderId: this.currentUserUid,
            },
          }
        );

        // lastMessageAt im Channel-Dokument aktualisieren
        await this.firestoreService.updateDocument(
          'channels',
          channelId,
          {
            lastMessageAt: now,
          }
        );

      } else if (this.contextType === 'conversation') {
        // --- CONVERSATION / DIREKTCHAT ---
        if (!this.conversationId) {
          console.warn('Keine Conversation-ID gesetzt – Nachricht wird nicht gesendet.');
          return;
        }

        const convId = this.conversationId;

        // Nachricht in conversations/{convId}/messages
        await this.firestoreService.addDocument(
          `conversations/${convId}/messages`,
          {
            text,
            senderId: this.currentUserUid,
            createdAt: now,
            editedAt: now,
            threadCount: 0,
            reactions: {
              emojiName: '',
              senderId: this.currentUserUid,
            },
          }
        );

        // lastMessageAt in conversations/{convId}
        await this.firestoreService.updateDocument(
          'conversations',
          convId,
          {
            lastMessageAt: now,
          }
        );
      }

      // 5. Eingabefeld leeren & Mentions schließen
      textarea.value = '';
      this.showMentions = false;
      this.activeMentionType = null;

    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }



  private getCurrentTriggerQuery(value: string, trigger: string): string | null {
    const lastIndex = value.lastIndexOf(trigger);
    if (lastIndex === -1) return null;

    const after = value.slice(lastIndex + 1);
    const spaceIndex = after.search(/\s/);
    const query = spaceIndex === -1 ? after : after.slice(0, spaceIndex);

    return query;
  }


  private updateMentionPosition() {
    const textarea = this.messageInput.nativeElement;
    const containerEl = this.container.nativeElement;

    const caretIndex = textarea.selectionStart ?? textarea.value.length;

    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);

    Array.from(style).forEach((name) => {
      mirror.style.setProperty(name, style.getPropertyValue(name));
    });

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.overflow = 'hidden';

    mirror.style.top = textarea.offsetTop + 'px';
    mirror.style.left = textarea.offsetLeft + 'px';
    mirror.style.width = textarea.clientWidth + 'px';

    mirror.textContent = textarea.value.substring(0, caretIndex);

    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.appendChild(marker);

    containerEl.appendChild(mirror);

    const markerRect = marker.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    this.mentionPosition = {
      top: markerRect.bottom - containerRect.top + 8,
      left: markerRect.left - containerRect.left,
      bottom: containerRect.bottom - markerRect.top + 8,
    };

    containerEl.removeChild(mirror);
  }

  // Name, wie er in der Liste angezeigt wird (mit "(Du)")
  getListLabel(user: User): string {
    const baseName = user.displayName ?? user.name ?? '';

    if (this.currentUserUid && user.uid === this.currentUserUid) {
      return `${baseName} (Du)`;
    }

    return baseName;
  }

  // Name, wie er in der Nachricht stehen soll (ohne "(Du)")
  getMentionLabel(user: User): string {
    return user.displayName ?? user.name ?? '';
  }

  onSelectUser(user: User) {
    const textarea = this.messageInput.nativeElement;
    const value = textarea.value;

    const lastAt = value.lastIndexOf('@');
    if (lastAt === -1) return;

    const before = value.slice(0, lastAt);
    const newValue = `${before}@${this.getMentionLabel(user)} `;

    textarea.value = newValue;
    textarea.focus();

    this.showMentions = false;
  }

  onSelectChannel(channel: Channel) {
    const textarea = this.messageInput.nativeElement;
    const value = textarea.value;

    const lastHash = value.lastIndexOf('#');
    if (lastHash === -1) return;

    const before = value.slice(0, lastHash);
    const newValue = `${before}#${channel.name} `;

    textarea.value = newValue;
    textarea.focus();

    this.showMentions = false;
    this.activeMentionType = null;
  }


}
