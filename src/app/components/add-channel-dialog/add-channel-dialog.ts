import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-channel-dialog',
  imports: [MatInputModule, MatButtonModule],
  templateUrl: './add-channel-dialog.html',
  styleUrl: './add-channel-dialog.scss',
})
export class AddChannelDialog {
  channelName = '';
  descriptionName = '';

  constructor(public dialogRef: MatDialogRef<AddChannelDialog>) { }

  closeDialog(){
    this.dialogRef.close();
  }
}
