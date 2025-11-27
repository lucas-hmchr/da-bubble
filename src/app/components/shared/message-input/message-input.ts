import { Component, Input, ElementRef, ViewChild } from '@angular/core';
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

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  users = [
    'Frederick Beck (Du)',
    'Sofia Müller',
    'Noah Braun',
    'Elise Roth',
    'Elias Neumann',
    'Steffen Hoffmann',
  ];

  showMentions = false;
  filteredUsers = [...this.users];

  mentionPosition = { top: 0, left: 0, bottom: 0 };


  constructor() {}

  onKeyup(event: KeyboardEvent) {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;

    const lastChar = value.slice(-1);

    if (lastChar === '@' && !this.showMentions) {
      this.showMentions = true;
      this.filteredUsers = [...this.users];
      this.updateMentionPosition();
      return;
    }

    if (!this.showMentions) return;

    this.updateMentionPosition();

    const mentionQuery = this.getCurrentMentionQuery(value);

    if (!mentionQuery) {
      this.showMentions = false;
      return;
    }

    this.filteredUsers = this.users.filter((u) =>
      u.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }

  private getCurrentMentionQuery(value: string): string | null {
    const lastAt = value.lastIndexOf('@');
    if (lastAt === -1) return null;

    const afterAt = value.slice(lastAt + 1);
    const spaceIndex = afterAt.search(/\s/);
    const query = spaceIndex === -1 ? afterAt : afterAt.slice(0, spaceIndex);

    return query;
  }

  private updateMentionPosition() {
  const textarea = this.messageInput.nativeElement;
  const containerEl = this.container.nativeElement;

  const caretIndex = textarea.selectionStart ?? textarea.value.length;

  const mirror = document.createElement('div');
  const style = window.getComputedStyle(textarea);

  Array.from(style).forEach((name) => {
    mirror.style.setProperty(name, style.getPropertyValue(name));
  });

  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflow = 'hidden';

  mirror.style.top = textarea.offsetTop + 'px';
  mirror.style.left = textarea.offsetLeft + 'px';
  mirror.style.width = textarea.clientWidth + 'px';

  mirror.textContent = textarea.value.substring(0, caretIndex);

  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  mirror.appendChild(marker);

  containerEl.appendChild(mirror);

  const markerRect = marker.getBoundingClientRect();
  const containerRect = containerEl.getBoundingClientRect();

  this.mentionPosition = {
    // top lassen wir zur Not drin, nutzen aber bottom fürs Dropdown
    top: markerRect.bottom - containerRect.top + 8,
    left: markerRect.left - containerRect.left,
    // Abstand vom unteren Rand des Containers, damit die Liste nach oben wächst
    bottom: containerRect.bottom - markerRect.top + 8,
  };

  containerEl.removeChild(mirror);
}



  onSelectUser(user: string) {
    const textarea = this.messageInput.nativeElement;
    const value = textarea.value;

    const lastAt = value.lastIndexOf('@');
    if (lastAt === -1) return;

    const before = value.slice(0, lastAt);
    const newValue = `${before}@${user} `;

    textarea.value = newValue;
    textarea.focus();

    this.showMentions = false;
  }
}
