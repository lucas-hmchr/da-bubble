import { Component, inject, signal } from '@angular/core';
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
  public userService = inject(UserService)
  channels = signal<Channel[]>([]);
  users = signal<User[]>([]);

  readonly channelOpen = signal(false);
  readonly dmOpen = signal(false);
  isClosed = signal(false);

  constructor(
    private dialog: MatDialog,
    private firestore: FirestoreService,
    private channelSelection: ChannelSelectionService   // 👈 neu
  ) {

    //CHANNELS LADEN
    this.firestore.getCollection<Channel>('channels').subscribe(chs => {
      this.channels.set(chs);
    });

    //USERS LADEN
    this.firestore.getCollection<User>('users').subscribe(us => {
      this.users.set(us);
    });

  }

  openAddChannelDialog() {
    this.dialog.open(AddChannelDialog, {
      width: '872px',
      maxWidth: 'none',
      height: '539px',
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
