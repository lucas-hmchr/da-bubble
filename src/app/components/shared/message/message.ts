import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Channel } from '../../../models/channel.interface';
import { FirestoreService } from '../../../services/firestore';
import { MessageData } from '../../../models/message.interface';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message implements OnChanges {
  @Input() channel?: Channel;
  messages$?: Observable<MessageData[]>;

  constructor(private firestoreService: FirestoreService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Diese Methode wird immer aufgerufen, wenn sich ein @Input-Wert ändert.
    if (changes['channel'] && this.channel) {
      this.loadMessages();
    }
  }

  loadMessages() {
    if (this.channel) {
      this.messages$ = this.firestoreService.getSubcollection<MessageData>('channels', this.channel.id, 'messages', 'createdAt');
    }
  }
}
