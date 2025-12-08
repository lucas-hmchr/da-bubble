import { Timestamp } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

export class UserService {

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
        const now = Date.now();
        return now - lastActive <= thresholdMs;
    }

    public isOnline(user: User) {
        return this.isUserOnline(user);
    }

    public getOnlineStatusIcon(user: User) {
        if (this.isOnline(user)) {
            return `/icons/global/Online.svg`;
        } else {
            return `/icons/global/Offline.svg`;
        }
    }
}


