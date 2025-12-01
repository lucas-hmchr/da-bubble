import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { Channel } from '../../../models/channel.interface';
import { FirestoreService } from '../../../services/firestore';
import { MessageData } from '../../../models/message.interface';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';
import { getAvatarById } from '../../../../shared/data/avatars';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message implements OnChanges {
  @Input() channel?: Channel;
  @Input() currentUserUid: string | null = null;   // <--- neu
  messages$?: Observable<MessageData[]>;

  users: User[] = [];
  messages: MessageData[] = [];
  @ViewChild('bottom') bottom!: ElementRef<HTMLDivElement>;
  private userMap = new Map<string, User>();

  constructor(private firestoreService: FirestoreService) {
    this.firestoreService.getCollection<User>('users').subscribe((users) => {
      this.users = users;
      this.userMap.clear();
      for (const u of users) {
        if (u.uid) {
          this.userMap.set(u.uid, u);
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channel'] && this.channel) {
      this.loadMessages();
    }
  }

  loadMessages() {
    if (!this.channel) return;

    this.firestoreService
      .getSubcollection<MessageData>('channels', this.channel.id, 'messages', 'createdAt')
      .subscribe((msgs) => {
        console.log('Neue Messages vom Firestore:', msgs);
        this.messages = msgs;
        // console.log('Listening to messages for channel', this.channel?.id);

        // nach Rendern der neuen Nachrichten nach unten scrollen
        setTimeout(() => this.scrollToBottom(), 0);
      });
  }

  getSenderName(senderId: string): string {
    const user = this.userMap.get(senderId);

    if (!user) {
      return 'Unknown user';
    }

    return user.displayName ?? user.name ?? 'Unknown user';
  }

  getSenderAvatarUrl(senderId: string): string {
    const user = this.userMap.get(senderId);

    // Fallback, falls User oder avatarUrl fehlt
    const avatar = getAvatarById(user?.avatarId);

    // passt zu deiner Struktur /public/images/avatars/*.svg
    return avatar.src;
  }


  isOwnMessage(msg: MessageData): boolean {
    return !!this.currentUserUid && msg.senderId === this.currentUserUid;
  }

  isSameDay(a: any, b: any): boolean {
    const d1 = this.toDate(a);
    const d2 = this.toDate(b);
    if (!d1 || !d2) return false;

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }


  toDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
      return value;
    }

    // Firestore Timestamp hat eine toDate()-Methode
    if (value.toDate) {
      return value.toDate();
    }

    // Fallback für alles andere (z.B. String)
    return new Date(value);
  }

  private scrollToBottom() {
    if (!this.bottom) return;
    this.bottom.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

}
