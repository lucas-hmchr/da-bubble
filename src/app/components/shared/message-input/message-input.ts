import { Component, Input, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel.interface';
import { FirestoreService } from '../../../services/firestore'; // Pfad anpassen
import { Avatar } from '../../../models/user.model';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput {
  @Input() channel?: Channel;
  @Input() currentUserUid: string | null = null;

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  // users = [
  //   'Frederick Beck (Du)',
  //   'Sofia Müller',
  //   'Noah Braun',
  //   'Elise Roth',
  //   'Elias Neumann',
  //   'Steffen Hoffmann',
  // ];

  users: Avatar[] = [];
  filteredUsers: Avatar[] = [];

  // filteredUsers = [...this.users];

  showMentions = false;
  mentionPosition = { top: 0, left: 0, bottom: 0 };


  constructor(private firestoreService: FirestoreService) { }

  ngOnInit(): void {
    // einfache Variante:
    this.firestoreService.getUsers().subscribe((users) => {
      this.users = users;
      this.filteredUsers = users;
    });

    // ODER, wenn du die shared-Variante nutzen willst:
    // this.firestoreService.loadUsersOnce();
    // this.firestoreService.users$.subscribe(users => {
    //   if (!users) return;
    //   this.users = users;
    //   this.filteredUsers = users;
    // });
  }

  onKeyup(event: KeyboardEvent) {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    const lastChar = value.slice(-1);

    if (lastChar === '@' && !this.showMentions) {
      this.showMentions = true;
      this.filteredUsers = this.users;
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

    const queryLower = mentionQuery.toLowerCase();

    this.filteredUsers = this.users.filter((u) =>
      (u.displayName ?? u.name ?? '')
        .toLowerCase()
        .includes(queryLower)
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
      top: markerRect.bottom - containerRect.top + 8,
      left: markerRect.left - containerRect.left,
      bottom: containerRect.bottom - markerRect.top + 8,
    };

    containerEl.removeChild(mirror);
  }

  // Name, wie er in der Liste angezeigt wird (mit "(Du)")
  getListLabel(user: Avatar): string {
    const baseName = user.displayName ?? user.name ?? '';

    if (this.currentUserUid && user.uid === this.currentUserUid) {
      return `${baseName} (Du)`;
    }

    return baseName;
  }

  // Name, wie er in der Nachricht stehen soll (ohne "(Du)")
  getMentionLabel(user: Avatar): string {
    return user.displayName ?? user.name ?? '';
  }

  onSelectUser(user: Avatar) {
    const textarea = this.messageInput.nativeElement;
    const value = textarea.value;

    const lastAt = value.lastIndexOf('@');
    if (lastAt === -1) return;

    const before = value.slice(0, lastAt);
    const newValue = `${before}@${this.getMentionLabel(user)} `;

    textarea.value = newValue;
    textarea.focus();

    this.showMentions = false;
  }


}
