import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
import { Channel } from '../../../models/channel.interface';
import { MessageData } from '../../../models/message.interface';
import { User } from '../../../models/user.model';
import { getAvatarById } from '../../../../shared/data/avatars';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [CommonModule, MessageInput, Message],
  templateUrl: './view.html',
  styleUrls: ['./view.scss'],
})
export class View implements OnInit {
  channel?: Channel;
  channelMembers: User[] = [];

  @Input() currentUserUid: string | null = null;
  editingMessage?: { id: string; text: string };

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.loadChannelByName('Devteam');
  }

  loadChannelByName(channelName: string) {
  this.firestoreService
    .getCollectionWhere<Channel>('channels', 'name', channelName)
    .subscribe({
      next: (channels) => {
        if (!channels.length) {
          console.log(`Kein Channel mit dem Namen "${channelName}" gefunden.`);
          return;
        }

        const baseChannel = channels[0]; // enthält id
        this.channel = baseChannel;

        // Channel-Dokument live beobachten
        this.firestoreService
          .getDocument<Channel>(`channels/${baseChannel.id}`)
          .subscribe((ch) => {
            if (!ch) return;

            // ✅ id vom ersten Resultat erhalten
            this.channel = { ...ch, id: baseChannel.id };

            this.loadChannelMembers(this.channel);
          });
      },
      error: (err) => console.error('Fehler beim Laden:', err),
    });
}


  /** Lädt alle Users, deren UID im Channel.members steht */
  private loadChannelMembers(channel: Channel) {
    const memberIds = new Set<string>(channel.members ?? []);

    this.firestoreService.getCollection<User>('users').subscribe((users) => {
      this.channelMembers = users.filter(
        (u) => !!u.uid && memberIds.has(u.uid!)
      );
    });
  }

  getAvatarSrc(user: User): string {
    if (user.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return '/images/avatars/avatar_default.svg';
  }

  onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id as string, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = undefined;
  }
}
