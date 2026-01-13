import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { getAvatarById } from '../../../shared/data/avatars';
import { UserService } from '../../services/user.service';
@Component({
  selector: 'app-add-people-dialog',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-people-dialog.html',
  styleUrl: './add-people-dialog.scss',
})
export class AddPeopleDialogComponent {

  @Input() channelId!: string;
  @Input() channelName!: string;
  @Output() close = new EventEmitter<void>();
  @Output() done = new EventEmitter<{
    mode: 'all' | 'specific';
    userIds: string[];
    channelId: string;
  }>();

  selectedOption: 'all' | 'specific' | null = null;

  selectedUsers: User[] = [];
  searchTerm = '';
  showDropdown = false;

  constructor(private firestore: FirestoreService, public userService: UserService) { }

  get users(): User[] {
    const list = this.firestore.userList();
    console.log('users:', list);
    return this.firestore.userList();
  }


  toggleUser(user: User) {
    const exists = this.selectedUsers.find(u => u.uid === user.uid);

    if (exists) {
      this.selectedUsers = this.selectedUsers.filter(u => u.uid !== user.uid);
    } else {
      this.selectedUsers = [...this.selectedUsers, user];
    }
  }

  isUserSelected(user: User) {
    return this.selectedUsers.some(u => u.uid === user.uid);
  }

  canSubmit(): boolean {
    if (this.selectedOption === 'all') return true;
    if (this.selectedOption === 'specific') return this.selectedUsers.length > 0;
    return false;
  }

  onDone() {
    if (!this.canSubmit()) return;

    console.log({
      option: this.selectedOption,
      users: this.selectedUsers,
    });

    this.done.emit({
      mode: this.selectedOption!,
      userIds: this.selectedUsers
        .map(u => u.uid)
        .filter((id): id is string => !!id),
      channelId: this.channelId,
    });
    this.close.emit();
  }

  filteredUsers(): User[] {
    if (!this.searchTerm.trim()) return [];

    const term = this.searchTerm.toLowerCase();

    return this.users
      .filter(u =>
        u.uid &&
        (
          u.displayName?.toLowerCase().includes(term) ||
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
        )
      )
      .filter(u => !this.isAlreadySelected(u));;
  }


  removeUser(user: User) {
    this.selectedUsers =
      this.selectedUsers.filter(u => u.uid !== user.uid);
  }

  getAvatarSrc(user: User): string {

    if (!user.avatarId) {
      return '/images/avatars/avatar_default.svg';
    }

    return getAvatarById(user.avatarId).src;
  }

  isAlreadySelected(user: User): boolean {
    return this.selectedUsers.some(u => u.uid === user.uid);
  }

}
