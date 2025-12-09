import { Injectable, signal } from '@angular/core';

export type ViewMode = 'channel' | 'newMessage';

@Injectable({ providedIn: 'root' })
export class ChannelSelectionService {
  readonly activeChannelId = signal<string | null>(null);
  readonly mode = signal<ViewMode>('channel');

  setActiveChannelId(id: string | null) {
    this.activeChannelId.set(id);
  }

  setMode(mode: ViewMode) {
    this.mode.set(mode);
    if (mode === 'newMessage') {
      // Channelauflistung „entkoppeln“, damit View weiß:
      // wir sind NICHT in einem Channel
      this.activeChannelId.set(null);
    }
  }
}

