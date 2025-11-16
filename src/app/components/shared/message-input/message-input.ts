import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel.interface';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput {
  @Input() channel?: Channel;

  constructor() { }
}
