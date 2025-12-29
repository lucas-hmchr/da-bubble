import { Component, inject, input, output, signal, OnInit, computed, ViewChild, ElementRef } from '@angular/core';
import { Channel } from '../../../../models/channel.interface';
import { User } from '../../../../models/user.model';
import { getDocs, collection, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';
import { AvatarId, getAvatarSrc } from '../../../../../shared/data/avatars';
import { UserService } from '../../../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-member-popup',
  imports: [CommonModule],
  templateUrl: './add-member-popup.html',
  styleUrl: './add-member-popup.scss',
})
export class AddMemberPopup implements OnInit {
  firestore: Firestore = inject(Firestore);
  userService = inject(UserService)

  channel = input<Channel | undefined>();
  closed = output<void>();

  users = signal<User[]>([]);
  addMemberList = signal<User[]>([]);

  query = signal('');
  isFocused = signal(false);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  filteredUsers = computed(() => {
    const q = this.query().trim().toLowerCase();
    const selectedIds = new Set(this.addMemberList().map(m => m.id));
    const channelMemberIds = new Set(this.channel()?.members ?? []); // <- neu
    return this.users()
      .filter(u => !channelMemberIds.has(u.id!))
      .filter(u => !selectedIds.has(u.id))
      .filter(u => {
        if (!q) return true;
        const hay = `${u.displayName ?? ''} ${u.email ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
  });

  async ngOnInit() {
    this.users.set(await this.loadUsersOnce());
  }

  closePopup() {
    this.closed.emit();
  }

  async loadUsersOnce(): Promise<User[]> {
    const snap = await getDocs(collection(this.firestore, 'users'));
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<User, 'id'>),
    })) as User[];
  }

  getAvatar(id: AvatarId) {
    return getAvatarSrc(id);
  }

  getOnlineIcon(user: User) {
    return this.userService.getOnlineStatusIcon(user)
  }

  onQueryInput(value: string) {
    this.query.set(value);
  }

  onFocus() {
    this.isFocused.set(true);
  }

  onBlur() {
    setTimeout(() => this.isFocused.set(false), 120);
  }

  focusSearchInput() {
    this.searchInput?.nativeElement.focus();
  }

  addMember(u: User) {
    this.addMemberList.update(list => [...list, u]);
    this.query.set('');
    this.focusSearchInput();
  }

  removeMember(u: User) {
    this.addMemberList.update(list => list.filter(m => m.id !== u.id));
  }

  async pushSelectedMembersToChannel() {
    const ch = this.channel();
    if (!ch?.id) return;
    const selectedIds = this.addMemberList()
      .map(u => u.id)
      .filter(Boolean);
    if (selectedIds.length === 0) return;
    const channelRef = doc(this.firestore as any, 'channels', ch.id);
    await updateDoc(channelRef, {
      members: arrayUnion(...selectedIds),
    });
    this.addMemberList.set([]);
    this.query.set('');
    this.closePopup();
  }
}
