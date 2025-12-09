import { Injectable, signal } from '@angular/core';
import { Channel } from '../models/channel.interface';

export type ViewMode = 'channel' | 'newMessage' | 'dm';

@Injectable({ providedIn: 'root' })
export class ChannelSelectionService {
  private _mode = signal<ViewMode>('channel');
  private _activeChannelId = signal<string | null>(null);
  private _activeDmUserId = signal<string | null>(null);

  readonly mode = this._mode.asReadonly();
  readonly activeChannelId = this._activeChannelId.asReadonly();
  readonly activeDmUserId = this._activeDmUserId.asReadonly();

  selectChannel(channel: Channel) {
    if (!channel.id) return;
    this._mode.set('channel');
    this._activeChannelId.set(channel.id);
    this._activeDmUserId.set(null);
  }

  setActiveChannelId(id: string) {
    this._mode.set('channel');
    this._activeChannelId.set(id);
    this._activeDmUserId.set(null);
  }

  openNewMessage() {
    this._mode.set('newMessage');
    this._activeChannelId.set(null);
    this._activeDmUserId.set(null);
  }

  openDirectMessage(userId: string) {
    this._mode.set('dm');
    this._activeDmUserId.set(userId);
    this._activeChannelId.set(null);
  }

  setMode(mode: ViewMode) {
    this._mode.set(mode);
  }
}
