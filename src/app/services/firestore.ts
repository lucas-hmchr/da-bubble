import { Injectable, inject } from '@angular/core';
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
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { Avatar } from '../models/user.model';

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

  constructor() { }

  getUsers(): Observable<Avatar[]> {
    return this.getCollection<Avatar>('users');
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

  getSubcollection<T extends object>(parentPath: string, parentId: string, subcollectionName: string, orderByField: string): Observable<T[]> {
    const path = `${parentPath}/${parentId}/${subcollectionName}`;
    const ref = collection(this.firestore, path);
    const q = query(ref, orderBy(orderByField, 'asc')); // Sortiert Nachrichten aufsteigend nach Zeit
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  private usersSubject = new BehaviorSubject<Avatar[] | null>(null);
  users$ = this.usersSubject.asObservable();

  loadUsersOnce() {
    if (this.usersSubject.value !== null) return; // schon geladen

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

    // 1. Nachricht in Subcollection "messages" anlegen
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

    // 2. lastMessageAt im Channel aktualisieren
    await updateDoc(channelRef, {
      lastMessageAt: now,
    });
  }
}
