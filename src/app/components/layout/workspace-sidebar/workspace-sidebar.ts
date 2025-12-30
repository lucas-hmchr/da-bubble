import {
  Component,
  Input,
  inject,
  signal,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { AddChannelDialog } from '../../add-channel-dialog/add-channel-dialog';
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { FirestoreService } from '../../../services/firestore';
import { ChannelService } from '../../../services/channel.service';
import { UserService } from '../../../services/user.service';
import { ChatContextService } from '../../../services/chat-context.service';
import { ConversationService } from '../../../services/conversation.service';
import { SearchService } from '../../../services/search.topbar.service';
import { NewMessageService } from '../../../services/new-message.service';
import { getAvatarById } from '../../../../shared/data/avatars';

@Component({
  selector: 'app-workspace-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule
  ],
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
      .subscribe(query => {
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

  /** ⭐ EINZIGE DATENQUELLEN FÜR DAS TEMPLATE ⭐ */
  visibleUsers = computed<User[]>(() => {
    if (this.newMessage$.mode() === 'user') {
      return this.newMessage$.filteredUsers();
    }
    if (this.isSearching()) {
      return this.filteredUsers();
    }
    return this.firestore.userList();
  });

  visibleChannels = computed<Channel[]>(() => {
    if (this.newMessage$.mode() === 'channel') {
      return this.newMessage$.filteredChannels();
    }
    if (this.isSearching()) {
      return this.filteredChannels();
    }
    return this.channelService.channels();
  });

  performSearch(query: string) {
    const term = query.toLowerCase().trim();

    this.filteredChannels.set(
      this.channelService.channels().filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      )
    );

    this.filteredUsers.set(
      this.firestore.userList().filter(u =>
        u.uid !== this.currentUserUid &&
        (
          u.displayName?.toLowerCase().includes(term) ||
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
        )
      )
    );
  }

  resetSearch() {
    this.filteredChannels.set(this.channelService.channels());
    this.filteredUsers.set(this.firestore.userList());
    this.searchQuery.set('');
  }

  openAddChannelDialog() {
    const isMobile = window.innerWidth < 1024;

    this.dialog.open(AddChannelDialog, {
      width: isMobile ? '100vw' : '872px',
      height: isMobile ? '100vh' : 'auto',
      maxWidth: isMobile ? '100vw' : 'none',
      panelClass: isMobile ? 'fullscreen-dialog' : '',
      data: { uid: this.currentUserUid },
    });
  }

  selectChannel(ch: Channel) {
    if (!ch.id) return;
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private autoOpenPanels = effect(() => {
    const mode = this.newMessage$.mode();

    if (mode === 'user') {
      this.dmOpen.set(true);
      this.channelOpen.set(false);
      return;
    }

    if (mode === 'channel') {
      this.channelOpen.set(true);
      this.dmOpen.set(false);
      return;
    }

    // mode === null → nichts erzwingen
  });

  isUserFilterActive = computed(() =>
    this.newMessage$.mode() === 'user'
  );

  isChannelFilterActive = computed(() =>
    this.newMessage$.mode() === 'channel'
  );

  isNormalView = computed(() =>
    this.newMessage$.mode() === null
  );

}
