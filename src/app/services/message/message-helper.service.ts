import { Injectable } from '@angular/core';
import { User } from '../../models/user.model';
import { getAvatarById } from '../../../shared/data/avatars';

@Injectable({ providedIn: 'root' })
export class MessageHelperService {
  private userMap = new Map<string, User>();

  buildUserMap(users: User[]): void {
    this.userMap.clear();
    for (const u of users) {
      if (u.uid) this.userMap.set(u.uid, u);
    }
  }

  getUserDisplayName(uid: string): string {
    const user = this.userMap.get(uid);
    return user?.displayName ?? user?.name ?? 'Unbekannter Nutzer';
  }

  getSenderAvatarUrl(senderId: string): string {
    const user = this.userMap.get(senderId);
    if (user?.avatarId) {
      return getAvatarById(user.avatarId).src;
    }
    return '/images/avatars/avatar_default.svg';
  }

  isOwnMessage(senderId: string, currentUserId: string | null): boolean {
    return senderId === currentUserId;
  }
}