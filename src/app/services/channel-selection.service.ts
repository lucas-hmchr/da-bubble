import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChannelSelectionService {
  /** aktuell ausgewählter Channel (ID) */
  readonly activeChannelId = signal<string | null>(null);

  setActiveChannelId(id: string) {
    this.activeChannelId.set(id);
  }
}
