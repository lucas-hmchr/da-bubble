import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  docData,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { User } from '../models/user.model';

export interface ChannelMessage {
  text: string;
  senderId: string;
  createdAt: any;
  editedAt: any;
  threadCount: number;
  reactions: {
    emojiName: string;
    senderId: string;
  };
}

@Injectable({
  providedIn: 'root'
})

export class FirestoreService {
  firestore: Firestore = inject(Firestore);

  userList = signal<User[]>([])
  userListSub: Subscription | undefined

  constructor() { }

  getUsers(): Observable<User[]> {
    return this.getCollection<User>('users');
  }

  subscribeUsers() {
    this.userListSub = this.getUsers().subscribe(u => {
      this.userList.set(u);
    });
  }

  getCollection<T extends object>(path: string): Observable<T[]> {
    const ref = collection(this.firestore, path);
    return collectionData(ref, { idField: 'id' }) as Observable<T[]>;
  }

  getDocument<T extends object>(path: string): Observable<T | undefined> {
    const ref = doc(this.firestore, path);
    return docData(ref) as Observable<T | undefined>;
  }

  addDocument<T extends object>(path: string, data: T) {
    const ref = collection(this.firestore, path);
    return addDoc(ref, data);
  }

  updateDocument<T extends object>(path: string, id: string, data: T) {
    const ref = doc(this.firestore, `${path}/${id}`);
    return updateDoc(ref, data);
  }

  deleteDocument(path: string, id: string) {
    const ref = doc(this.firestore, `${path}/${id}`);
    return deleteDoc(ref);
  }

  getCollectionWhere<T extends object>(path: string, field: string, value: any): Observable<T[]> {
    const ref = collection(this.firestore, path);
    const q = query(ref, where(field, '==', value));
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  getSubcollection<T extends object>(
    parentPath: string,
    parentId: string,
    subcollectionName: string,
    orderByField: string
  ): Observable<T[]> {
    const path = `${parentPath}/${parentId}/${subcollectionName}`;
    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy(orderByField, 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  private usersSubject = new BehaviorSubject<User[] | null>(null);
  users$ = this.usersSubject.asObservable();

  loadUsersOnce() {
    if (this.usersSubject.value !== null) return;

    this.getUsers().subscribe((users) => {
      this.usersSubject.next(users);
    });
  }

  async sendMessageToChannel(
    channelId: string,
    text: string,
    senderId: string
  ): Promise<void> {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    const messagesRef = collection(this.firestore, `channels/${channelId}/messages`);

    const now = serverTimestamp();

    await addDoc(messagesRef, <ChannelMessage>{
      text,
      senderId,
      createdAt: now,
      editedAt: now,
      threadCount: 0,
      reactions: {
        emojiName: '',
        senderId,
      },
    });

    await updateDoc(channelRef, {
      lastMessageAt: now,
    });
  }
}