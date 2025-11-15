import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../services/firestore';
import { MessageInput } from '../../shared/message-input/message-input';

// ----------- Interface MUSS ÜBER dem decorator stehen! -------------
interface Channel {
  id: string;
  name: string;
  members: string[];
  createdAt?: any;
  lastMessageAt?: any;
}

// ---------------- Component decorator -----------------
@Component({
  selector: 'app-view',
  standalone: true,
  imports: [
    CommonModule,
    MessageInput
  ],
  templateUrl: './view.html',
  styleUrls: ['./view.scss'], // <-- styleUrls (Mehrzahl)
})
// ---------------- Klasse direkt NACH dem Decorator -----------------
export class View implements OnInit {

  channel?: Channel;

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.firestoreService
      .getCollectionWhere<Channel>('channels', 'name', 'Devteam')
      .subscribe((result) => {
        this.channel = result[0];
        console.log('Geladener Channel:', this.channel);
      });
  }

  loadChannelByName() {
    this.firestoreService
      .getCollectionWhere<Channel>('channels', 'name', 'Devteam')
      .subscribe({
        next: (channels) => {
          if (channels.length === 0) {
            console.log('Kein Channel mit dem Namen "Devteam" gefunden.');
          } else {
            console.log('Channel gefunden:', channels[0]);
          }
        },
        error: (err) => {
          console.error('Fehler beim Laden:', err);
        }
      });
  }
}
