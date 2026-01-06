import { Component, Inject } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from "@angular/forms";
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

  constructor(
    public dialogRef: MatDialogRef<AddChannelDialog>,
    private firestore: FirestoreService,
    @Inject(MAT_DIALOG_DATA) public data: { uid: string }) { }

  closeDialog() {
    this.dialogRef.close();
  }

  createChannel() {
    if (!this.channelName.trim()) return;

    const newChannel: Channel = {
      name: this.channelName.trim(),
      description: this.descriptionName.trim() || '',
      members: [this.data.uid],           // Ersteller ist erstes Mitglied
      createdAt: Date.now(),
      lastMessageAt: null
    };

    this.firestore.addDocument('channels', newChannel).then((docRef) => {
      const channelId = docRef.id; // 🔑 sehr wichtig

      this.dialogRef.close({
        created: true,
        channelId: channelId
      });
    });

  }

}
