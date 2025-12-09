import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AddChannelDialog } from '../../add-channel-dialog/add-channel-dialog';
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { FirestoreService } from '../../../services/firestore';
import { getAvatarById } from '../../../../shared/data/avatars';
import { UserService } from '../../../services/user.service';
import { ChannelSelectionService } from '../../../services/channel-selection.service';

@Component({
  selector: 'app-workspace-sidebar',
  imports: [MatSidenavModule, MatButtonModule, MatExpansionModule, MatIconModule],
  templateUrl: './workspace-sidebar.html',
  styleUrl: './workspace-sidebar.scss',
})

export class WorkspaceSidebar {
  @Input() users: User[] = [];
  @Input() currentUserUid: string | null = null;
  @Output() channelSelected = new EventEmitter<Channel>();

  public userService = inject(UserService)
  channels = signal<Channel[]>([]);

  readonly channelOpen = signal(false);
  readonly dmOpen = signal(false);
  isClosed = signal(false);

  constructor(
    private dialog: MatDialog,
    private firestore: FirestoreService,
    private channelSelection: ChannelSelectionService
  ) {

    console.log(this.channelSelected);

    //CHANNELS LADEN
    this.firestore.getCollection<Channel>('channels').subscribe(chs => {
      this.channels.set(chs);

      const first = chs[0];
      if (first && !this.channelSelection.activeChannelId()) {
        this.channelSelection.setActiveChannelId(first.id as string);
      }
    });

  }

  openAddChannelDialog() {
    this.dialog.open(AddChannelDialog, {
      width: '872px',
      maxWidth: 'none',
      height: '539px',
      data: { uid: this.currentUserUid }
    });
  }

  getAvatarPath(user: User) {
    return getAvatarById(user.avatarId).src;
  }

  selectChannel(channel: Channel) {
    if (!channel.id) return;
    this.channelSelection.setActiveChannelId(channel.id as string);
  }
}
