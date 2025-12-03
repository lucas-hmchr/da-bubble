import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
import { Channel } from '../../../models/channel.interface';
import { MessageData } from '../../../models/message.interface';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    MessageInput,
    Message
  ],
  templateUrl: './view.html',
  styleUrls: ['./view.scss'],
})

export class View implements OnInit {

  channel?: Channel;
  @Input() currentUserUid: string | null = null; 
  editingMessage?: { id: string; text: string };
  constructor(private firestoreService: FirestoreService) { }

  ngOnInit(): void {
    this.loadChannelByName("Devteam");
  }

  loadChannelByName(channelName: string) {
    this.firestoreService
      .getCollectionWhere<Channel>('channels', 'name', channelName)
      .subscribe({
        next: (channels) => {
          if (channels.length === 0) {
            console.log(`Kein Channel mit dem Namen "${channelName}" gefunden.`);
          } else {
            this.channel = channels[0];
          }
        },
        error: (err) => {
          console.error('Fehler beim Laden:', err);
        }
      });
  }

    onEditRequested(msg: MessageData) {
    if (!msg.id) return;
    this.editingMessage = { id: msg.id as string, text: msg.text };
  }

  onEditFinished() {
    this.editingMessage = undefined;
  }

  
}
