import { Component, OnInit, Input, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
import { Channel } from '../../../models/channel.interface';
import { MessageData } from '../../../models/message.interface';
import { User } from '../../../models/user.model';
import { getAvatarById } from '../../../../shared/data/avatars';
import { ChannelSelectionService } from '../../../services/channel-selection.service';

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

  private channelSelection = inject(ChannelSelectionService);

  constructor(private firestoreService: FirestoreService) {

    // reagiert immer, wenn in der Sidebar ein anderer Channel gewählt wird
    effect(() => {
      const id = this.channelSelection.activeChannelId();
      if (id) {
        this.loadChannelById(id);
      }
    });
  }

  ngOnInit(): void {
    // Optional: default Channel setzen, falls noch keiner ausgewählt
    // z.B. ersten Channel automatisch wählen – kann man später ergänzen
  }

  /** Channel-Dokument per ID laden (inkl. Live-Updates) */
  private loadChannelById(channelId: string) {
    this.firestoreService
      .getDocument<Channel>(`channels/${channelId}`)
      .subscribe((ch) => {
        if (!ch) {
          console.log('Channel nicht gefunden:', channelId);
          return;
        }
        // id vom Pfad behalten
        this.channel = { ...ch, id: channelId };
        this.loadChannelMembers(this.channel);
      });
  }

  /** User laden, deren UID im Channel.members steht */
  private loadChannelMembers(channel: Channel) {
    const memberIds = new Set<string>(channel.members ?? []);

    this.firestoreService.getCollection<User>('users').subscribe((users) => {
      this.channelMembers = users.filter(
        (u) => !!u.uid && memberIds.has(u.uid!)
      );
    });
  }

  getAvatarSrc(user: User) {
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
