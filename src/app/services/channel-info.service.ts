import { Injectable, signal } from '@angular/core';
import { Channel } from '../models/channel.interface';

@Injectable({ providedIn: 'root' })
export class ChannelInfoService {
  isOpen = signal(false);
  channel = signal<Channel | null>(null);

  open(channel: Channel) {
    this.channel.set(channel);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.channel.set(null);
  }
}