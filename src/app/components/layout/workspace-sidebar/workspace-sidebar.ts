import { Component, Input, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AddChannelDialog } from '../../add-channel-dialog/add-channel-dialog';
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { FirestoreService } from '../../../services/firestore';
import { getAvatarById, getAvatarSrc } from '../../../../shared/data/avatars';
import { UserService } from '../../../services/user.service';
import { ChannelService } from '../../../services/channel.service';
import { ChatContextService } from '../../../services/chat-context.service';
import { ConversationService } from '../../../services/conversation.service';

@Component({
  selector: 'app-workspace-sidebar',
  standalone: true,
  imports: [MatSidenavModule, MatButtonModule, MatExpansionModule, MatIconModule],
  templateUrl: './workspace-sidebar.html',
  styleUrl: './workspace-sidebar.scss',
})
export class WorkspaceSidebar {
  @Input() currentUserUid: string | null = null;

  readonly channelOpen = signal(false);
  readonly dmOpen = signal(false);
  isClosed = signal(false);

  constructor(
    private dialog: MatDialog,
    private firestore: FirestoreService,
    private channelService: ChannelService,
    private chatContext: ChatContextService,
    public userService: UserService,
    public conversationService: ConversationService,
  ) { }

  get allChannels(): Channel[] {
    return this.channelService.channels();
  }

  get allUsers(): User[] {
    return this.firestore.userList();
  }

  openAddChannelDialog() {
    this.dialog.open(AddChannelDialog, {
      width: '872px',
      maxWidth: 'none',
      height: '539px',
      data: { uid: this.currentUserUid },
    });
  }

  selectChannel(ch: Channel) {
    if (!ch.id) {
      console.warn('Channel ohne id:', ch);
      return;
    }
    this.chatContext.openChannel(ch.id);
  }

  openNewMessage() {
    this.chatContext.openNewMessage();
  }

  openDirectMessage(user: User) {
    if (!user.uid) return;
    this.chatContext.openConversation(user.uid);
  }

  getAvatarPath(user: User) {
    return getAvatarById(user.avatarId).src;
  }

  isChannelActive(channel: Channel): boolean {
    return this.chatContext.channelId() === channel.id;
  }
}
