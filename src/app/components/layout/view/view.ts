import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';
import { Message } from '../../shared/message/message';
import { Channel } from '../../../models/channel.interface';

@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    MessageInput,
    Message
  ],
  templateUrl: './view.html',
  styleUrls: ['./view.scss'], // <-- styleUrls (Mehrzahl)
})
// ---------------- Klasse direkt NACH dem Decorator -----------------
export class View implements OnInit {

  channel?: Channel;

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.loadChannelByName("Devteam");
    // this.firestoreService
    //   .getCollectionWhere<Channel>('channels', 'name', 'Devteam')
    //   .subscribe((result) => {
    //     this.channel = result[0];
    //     console.log('Geladener Channel:', this.channel);
    //   });
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
}
