import { Timestamp } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
<<<<<<< HEAD
  private now = signal(Date.now());

  constructor() {
    setInterval(() => {
      this.now.set(Date.now());
    }, 30_000);
  }

  private isUserOnline(user: User, thresholdMs = 3 * 60 * 1000): boolean {
    if (!user.lastActiveAt) return false;
    const lastActive =
      user.lastActiveAt instanceof Timestamp
        ? user.lastActiveAt.toMillis()
        : new Date(user.lastActiveAt).getTime();
    const now = this.now();
    return now - lastActive <= thresholdMs;
  }

  public isOnline(user: User | null | undefined): boolean {
    if (!user) return false;
    return this.isUserOnline(user);
  }

  public getOnlineStatusIcon(user: User | null | undefined): string {
    if (!user) {
      // Fallback: kein User => behandeln wie offline
      return '/icons/global/Offline.svg';
    }

    if (this.isOnline(user)) {
      return '/icons/global/Online.svg';
    } else {
      return '/icons/global/Offline.svg';
    }
  }
=======

    private now = signal(Date.now());

    constructor(private firestoreService: FirestoreService) {
        setInterval(() => {
            this.now.set(Date.now());
        }, 30_000);
    }

    private isUserOnline(user: User, thresholdMs = 3 * 60 * 1000): boolean {
        if (!user?.lastActiveAt) return false;
        const lastActive =
            user.lastActiveAt instanceof Timestamp
                ? user.lastActiveAt.toMillis()
                : new Date(user.lastActiveAt).getTime();
        const now = Date.now();
        return now - lastActive <= thresholdMs;
    }

    public isOnline(user: User) {
        return this.isUserOnline(user);
    }

    public getOnlineStatusIcon(user: User) {
        if (this.isOnline(user)) {
            return `/assets/icons/global/Online.svg`;
        } else {
            return `/assets/icons/global/Offline.svg`;
        }
    }

    public getUserByUid(uid: string): Observable<User | undefined> {
        return this.firestoreService.getDocument<User>(`users/${uid}`);
    }

>>>>>>> ee3eec266c2dc6cde20db4744cb51b7e99ed4fea
}
