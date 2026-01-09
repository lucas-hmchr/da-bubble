import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-add-people-dialog',
  imports: [],
  templateUrl: './add-people-dialog.html',
  styleUrl: './add-people-dialog.scss',
})
export class AddPeopleDialog {
  @Input() channelId!: string;

  @Output() close = new EventEmitter<void>();

  selectedOption: 'all' | 'specific' | null = null;

  onDone() {
    if (!this.selectedOption) return;

    console.log('Auswahl:', this.selectedOption);
    this.close.emit();
  }
}
