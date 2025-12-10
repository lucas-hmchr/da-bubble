import { Injectable, inject, signal } from '@angular/core';
import { FirestoreService } from './firestore';
import { Channel } from '../models/channel.interface';

@Injectable({ providedIn: 'root' })
export class ChannelStoreService {
  private firestore = inject(FirestoreService);

  private _channels = signal<Channel[]>([]);
  readonly channels = this._channels.asReadonly();

  constructor() {
    this.firestore.getCollection<Channel>('channels').subscribe((channels) => {
      this._channels.set(channels);
    });
  }

  getById(id: string | null | undefined): Channel | undefined {
    if (!id) return undefined;
    return this._channels().find((c) => c.id === id);
  }
}
