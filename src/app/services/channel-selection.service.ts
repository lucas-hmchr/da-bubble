import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChannelSelectionService {
  readonly activeChannelId = signal<string | null>(null);

  setActiveChannelId(id: string) {
    this.activeChannelId.set(id);
  }
}
