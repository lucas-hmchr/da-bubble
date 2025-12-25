import { Component, Input, inject, signal, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { AddChannelDialog } from '../../add-channel-dialog/add-channel-dialog';
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { FirestoreService } from '../../../services/firestore';
import { getAvatarById } from '../../../../shared/data/avatars';
import { UserService } from '../../../services/user.service';
import { ChannelService } from '../../../services/channel.service';
import { ChatContextService } from '../../../services/chat-context.service';
import { ConversationService } from '../../../services/conversation.service';
import { SearchService } from '../../../services/search.topbar.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { NewMessageService } from '../../../services/new-message.service';

@Component({
  selector: 'app-workspace-sidebar',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatButtonModule, MatExpansionModule, MatIconModule],
  templateUrl: './workspace-sidebar.html',
  styleUrl: './workspace-sidebar.scss',
})
export class WorkspaceSidebar implements OnInit, OnDestroy {
  @Input() currentUserUid: string | null = null;
  @Input() isMobile = false;
  @Output() newMessage = new EventEmitter<void>();

  newMessage$ = inject(NewMessageService);
  readonly channelOpen = signal(false);
  readonly dmOpen = signal(false);
  isClosed = signal(false);

  isSearching = signal(false);
  searchQuery = signal('');
  filteredChannels = signal<Channel[]>([]);
  filteredUsers = signal<User[]>([]);

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private firestore: FirestoreService,
    private channelService: ChannelService,
    private chatContext: ChatContextService,
    public userService: UserService,
    public conversationService: ConversationService,
    private searchService: SearchService
  ) { }

  ngOnInit() {
    this.resetSearch();

    this.searchService.searchQuery$
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((query) => {
        this.searchQuery.set(query);

        if (query.trim()) {
          this.isSearching.set(true);
          this.performSearch(query);
        } else {
          this.isSearching.set(false);
          this.resetSearch();
        }
      });
  }

    onNewMessageToKeyup(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    this.newMessage$.setQuery(input.value);
  }

  get allChannels(): Channel[] {
    return this.isSearching() ? this.filteredChannels() : this.channelService.channels();
  }

  get allUsers(): User[] {
    return this.isSearching() ? this.filteredUsers() : this.firestore.userList();
  }

  performSearch(query: string) {
    const searchTerm = query.toLowerCase().trim();

    const channels = this.channelService
      .channels()
      .filter(
        (channel) =>
          channel.name?.toLowerCase().includes(searchTerm) ||
          channel.description?.toLowerCase().includes(searchTerm)
      );
    this.filteredChannels.set(channels);

    const users = this.firestore
      .userList()
      .filter(
        (user) =>
          user.uid !== this.currentUserUid &&
          (user.displayName?.toLowerCase().includes(searchTerm) ||
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm))
      );
    this.filteredUsers.set(users);
  }

  resetSearch() {
    this.filteredChannels.set(this.channelService.channels());
    this.filteredUsers.set(this.firestore.userList());
    this.searchQuery.set('');
  }

  openAddChannelDialog() {
    this.dialog.open(AddChannelDialog, {
      width: '872px',
      maxWidth: 'none',
      height: '539px',
      data: { uid: this.currentUserUid },
    });
  }

  selectChannel(ch: Channel) {
    if (!ch.id) {
      console.warn('Channel ohne id:', ch);
      return;
    }
    this.chatContext.openChannel(ch.id);
    this.clearSearchIfActive();
  }

  openNewMessage() {
    this.chatContext.openNewMessage();
  }

  openDirectMessage(user: User) {
    if (!user.uid) return;
    this.chatContext.openConversation(user.uid);
    this.clearSearchIfActive();
  }

  clearSearchIfActive() {
    if (this.isSearching()) {
      this.searchService.clearSearch();
    }
  }

  getAvatarPath(user: User) {
    return getAvatarById(user.avatarId).src;
  }

  isChannelActive(channel: Channel): boolean {
    return this.chatContext.channelId() === channel.id;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
