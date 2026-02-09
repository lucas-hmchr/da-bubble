import { Component, Inject } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../models/channel.interface';
import { FirestoreService } from '../../services/firestore';

@Component({
  selector: 'app-add-channel-dialog',
  imports: [MatInputModule, MatButtonModule, FormsModule, MatDialogModule],
  templateUrl: './add-channel-dialog.html',
  styleUrl: './add-channel-dialog.scss',
})
export class AddChannelDialog {
  channelName = '';
  descriptionName = '';
  isPrivate = true;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<AddChannelDialog>,
    private firestore: FirestoreService,
    @Inject(MAT_DIALOG_DATA) public data: { uid: string },
  ) { }
  closeDialog() {
    this.dialogRef.close();
  }

  async createChannel() {
    const rawName = this.channelName.trim();
    if (!rawName) return;

    const normalized = rawName.toLowerCase();

    // 1) vorhandene Channels laden (einmalig)
    const channels = await this.firestore.getCollectionOnce<Channel>('channels');

    // 2) Duplikat-Check (case-insensitive)
    const exists = channels.some(ch =>
      (ch.name ?? '').trim().toLowerCase() === normalized
    );

    if (exists) {
      this.errorMessage = 'Dieser Channel existiert bereits.';
      return;
    }


    const newChannel: Channel = {
      name: rawName,
      description: this.descriptionName.trim() || '',
      members: [this.data.uid],
      createdAt: Date.now(),
      lastMessageAt: null,

      isPrivate: this.isPrivate,
      createdBy: this.data.uid,
      admins: [this.data.uid],
    };

    const docRef = await this.firestore.addDocument('channels', newChannel);
    const channelId = docRef.id;

    this.dialogRef.close({
      created: true,
      channelId,
      channelName: newChannel.name,
    });
  };

  onChannelNameInput() {
  this.errorMessage = '';
}

}
