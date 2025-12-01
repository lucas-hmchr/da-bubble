import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Channel } from '../../../models/channel.interface';
import { FirestoreService } from '../../../services/firestore';
import { MessageData } from '../../../models/message.interface';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Avatar } from '../../../models/user.model';

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

  users: Avatar[] = [];
  private userMap = new Map<string, Avatar>();

  constructor(private firestoreService: FirestoreService) {
    // Alle User einmal laden, damit wir später Namen zuordnen können
    this.firestoreService.getCollection<Avatar>('users').subscribe((users) => {
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
    if (this.channel) {
      this.messages$ = this.firestoreService.getSubcollection<MessageData>(
        'channels',
        this.channel.id,
        'messages',
        'createdAt'
      );
    }
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
    const avatarName =
      user?.avatarUrl || 'avatar_default';

    // passt zu deiner Struktur /public/images/avatars/*.svg
    return `/images/avatars/${avatarName}.svg`;
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

}
