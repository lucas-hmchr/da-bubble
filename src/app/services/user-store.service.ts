import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from './firestore';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private firestore = inject(FirestoreService);

  private _users = signal<User[]>([]);
  readonly users = this._users.asReadonly();

  constructor() {
    this.firestore.getCollection<User>('users').subscribe(users => {
      this._users.set(users);
    });
  }

  getUserByUid(uid: string | null | undefined): User | undefined {
    if (!uid) return undefined;
    return this._users().find(u => u.uid === uid);
  }
}
