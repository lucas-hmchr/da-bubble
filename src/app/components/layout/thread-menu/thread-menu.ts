import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThreadService } from '../../../services/thread.service';
import { ChannelService } from '../../../services/channel.service';
import { MessageInput } from '../../shared/message-input/message-input';

import { Channel } from '../../../models/channel.interface';
import { Message } from '../../shared/message/message';

@Component({
  selector: 'app-thread-menu',
  standalone: true,
  imports: [CommonModule, MessageInput, Message],
  templateUrl: './thread-menu.html',
  styleUrl: './thread-menu.scss',
})
export class ThreadMenu {
  @Input() currentUserUid: string | null = null;

  public threadService = inject(ThreadService);
  private channelService = inject(ChannelService);

  closeThread() {
    this.threadService.close();
  }

  async onThreadMessageSent(event: { text: string }) {
    if (!this.currentUserUid) {
      return;
    }

    try {
      await this.threadService.sendThreadMessage(event.text, this.currentUserUid);
    } catch (error) {
    }
  }

  getChannelById(channelId: string | null): Channel | undefined {
    if (!channelId) return undefined;
    return this.channelService.channels().find(ch => ch.id === channelId);
  }
}