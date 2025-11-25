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

  constructor() {}

  onKeyup(event: KeyboardEvent) {
  const textarea = event.target as HTMLTextAreaElement;
  const value = textarea.value;

  console.log('keyup', value);

  // letztes Zeichen im Text
  const lastChar = value.slice(-1);

  // 1. Dropdown öffnen, sobald der Text mit @ endet
  if (lastChar === '@' && !this.showMentions) {
    this.showMentions = true;
    this.filteredUsers = [...this.users];
    return;
  }

  // 2. Wenn Dropdown nicht offen ist, brauchen wir unten nichts tun
  if (!this.showMentions) {
    return;
  }

  // 3. Wenn Dropdown offen ist: Text nach letztem @ auslesen und filtern
  const mentionQuery = this.getCurrentMentionQuery(value);

  if (!mentionQuery) {
    // kein @ mehr im Text → Dropdown schließen
    this.showMentions = false;
    return;
  }

  this.filteredUsers = this.users.filter((u) =>
    u.toLowerCase().includes(mentionQuery.toLowerCase())
  );
}


  // holt alles nach dem letzten @ im Text (bis zum nächsten Leerzeichen)
  private getCurrentMentionQuery(value: string): string | null {
    const lastAt = value.lastIndexOf('@');
    if (lastAt === -1) return null;

    const afterAt = value.slice(lastAt + 1);
    const spaceIndex = afterAt.search(/\s/);
    const query = spaceIndex === -1 ? afterAt : afterAt.slice(0, spaceIndex);

    return query;
  }

  onSelectUser(user: string) {
    const textarea = this.messageInput.nativeElement;
    const value = textarea.value;

    const lastAt = value.lastIndexOf('@');
    if (lastAt === -1) return;

    // alles ab @ durch @Username ersetzen
    const before = value.slice(0, lastAt);
    const newValue = `${before}@${user} `;

    textarea.value = newValue;
    textarea.focus();

    this.showMentions = false;
  }
}
