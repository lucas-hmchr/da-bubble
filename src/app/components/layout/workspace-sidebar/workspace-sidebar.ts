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
  effect,
  ViewChild,
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
import { MessageSearchResult } from '../../../services/search.service';
import { FirestoreService } from '../../../services/firestore';
import { ChannelService } from '../../../services/channel.service';
import { UserService } from '../../../services/user.service';
import { ChatContextService } from '../../../services/chat-context.service';
import { ConversationService } from '../../../services/conversation.service';
import { SearchService } from '../../../services/search.service';
import { NewMessageService } from '../../../services/message/new-message.service';
import { getAvatarById } from '../../../../shared/data/avatars';
import { AddPeopleDialogComponent } from '../../add-people-dialog/add-people-dialog';
import { MatDrawer } from '@angular/material/sidenav';

@Component({
  selector: 'app-workspace-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    AddPeopleDialogComponent,
  ],
  templateUrl: './workspace-sidebar.html',
  styleUrl: './workspace-sidebar.scss',
})
export class WorkspaceSidebar implements OnInit, OnDestroy {
  @Input() currentUserUid: string | null = null;
  @Input() isMobile = false;
  @Output() newMessage = new EventEmitter<void>();
  @Output() mobileViewChange = new EventEmitter<'sidebar' | 'chat' | 'thread'>();
  @Output() workspaceToggle = new EventEmitter<boolean>();

  @ViewChild('drawer') drawer!: MatDrawer;
  newMessage$ = inject(NewMessageService);

  readonly channelOpen = signal(false);
  readonly dmOpen = signal(false);
  isClosed = signal(false);

  isSearching = signal(false);
  searchQuery = signal('');
  searchType = signal<'all' | 'channels' | 'users'>('all');

  filteredChannels = signal<Channel[]>([]);
  filteredUsers = signal<User[]>([]);
  filteredMessages = signal<MessageSearchResult[]>([]);

  showAddPeopleDialog = false;
  createdChannelId: string | null = null;
  createdChannelName: string | null = null;

  private destroy$ = new Subject<void>();
  constructor(
    private dialog: MatDialog,
    private firestore: FirestoreService,
    private channelService: ChannelService,
    private chatContext: ChatContextService,
    public userService: UserService,
    public conversationService: ConversationService,
    private searchService: SearchService,
  ) {}

  ngOnInit() {
    this.resetSearch();

    this.searchService.searchQuery$
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe((query) => {
        // ========== NEU: Only show search in sidebar on mobile ==========
        if (!this.isMobile) {
          this.isSearching.set(false);
          return;
        }
        
        this.searchQuery.set(query);
        const type = this.searchService.getSearchType();
        this.searchType.set(type);

        if (query.trim()) {
          this.isSearching.set(true);
          this.performSearch(query, type);
        } else {
          this.isSearching.set(false);
          this.resetSearch();
        }
      });
  }

  onNewMessageToKeyup(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const query = input.value;
    
    // ========== Mobile: Handle search directly ==========
    if (this.isMobile) {
      this.searchQuery.set(query);
      const type = this.searchService.getSearchType();
      this.searchType.set(type);

      if (query.trim()) {
        this.isSearching.set(true);
        this.performSearch(query, type);
      } else {
        this.isSearching.set(false);
        this.resetSearch();
      }
    }
  }

  /** ⭐ EINZIGE DATENQUELLEN FÜR DAS TEMPLATE ⭐ */
  visibleUsers = computed<User[]>(() => {
    if (this.isSearching()) {
      return this.filteredUsers();
    }
    return this.getAllUsersWithNames();
  });

  visibleChannels = computed<Channel[]>(() => {
    if (this.isSearching()) {
      return this.filteredChannels();
    }
    return this.channelService.channels();
  });

  // ========== NEU: Helper method to filter users without names ==========
  private getAllUsersWithNames(): User[] {
    return this.firestore.userList().filter(u => u.displayName || u.name);
  }

  performSearch(query: string, type: 'all' | 'channels' | 'users' = 'all') {
    const term = query.toLowerCase().trim();

    if (type === 'all' || type === 'channels') {
      // ========== NEU: Use service filter method ==========
      this.filteredChannels.set(this.searchService.filterChannelsByTerm(term));
    } else {
      this.filteredChannels.set([]);
    }

    if (type === 'all' || type === 'users') {
      // ========== NEU: Show ALL users (don't exclude current user) ==========
      this.filteredUsers.set(
        this.searchService.filterUsersByTerm(term, false, this.currentUserUid)
      );
    } else {
      this.filteredUsers.set([]);
    }

    // ========== NEU: Search messages in mobile ==========
    if (type === 'all') {
      this.searchMessages(term);
    } else {
      this.filteredMessages.set([]);
    }
  }

  // ========== NEU: Search messages method ==========
  private searchMessages(term: string): void {
    const lowerTerm = term.toLowerCase();
    const channels = this.channelService.channels();
    
    if (channels.length === 0) {
      this.filteredMessages.set([]);
      return;
    }
    
    const results: MessageSearchResult[] = [];
    let processedChannels = 0;
    
    channels.forEach(channel => {
      if (!channel.id) {
        processedChannels++;
        return;
      }
      
      const messagesPath = `channels/${channel.id}/messages`;
      
      this.firestore.getCollection<any>(messagesPath).subscribe({
        next: (messages) => {
          const matching = messages.filter((msg: any) => 
            msg.text && msg.text.toLowerCase().includes(lowerTerm)
          );
          
          for (const msg of matching) {
            if (!msg.id) continue;
            
            const sender = this.firestore.userList().find(u => u.uid === msg.senderId);
            results.push({
              id: msg.id,
              text: msg.text || '',
              senderId: msg.senderId || '',
              senderName: sender?.displayName || sender?.name || 'Unbekannt',
              createdAt: msg.createdAt,
              contextType: 'channel',
              contextId: channel.id!,
              contextName: `# ${channel.name}`
            });
          }
          
          processedChannels++;
          
          if (processedChannels === channels.length) {
            results.sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0;
              const bTime = b.createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            });
            
            this.filteredMessages.set(results.slice(0, 20));
          }
        },
        error: (error) => {
          console.error(`Error searching channel ${channel.name}:`, error);
          processedChannels++;
          
          if (processedChannels === channels.length) {
            results.sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0;
              const bTime = b.createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            });
            
            this.filteredMessages.set(results.slice(0, 20));
          }
        }
      });
    });
  }

  resetSearch() {
    this.filteredChannels.set(this.channelService.channels());
    // ========== GEÄNDERT: Use filtered users ==========
    this.filteredUsers.set(this.getAllUsersWithNames());
    this.searchQuery.set('');
    this.searchType.set('all');
  }

  openAddChannelDialog() {
    const isMobile = window.innerWidth < 1024;

    const dialogRef = this.dialog.open(AddChannelDialog, {
      width: isMobile ? '100vw' : '872px',
      height: isMobile ? '100vh' : 'auto',
      maxWidth: isMobile ? '100vw' : 'none',
      panelClass: isMobile ? 'fullscreen-dialog' : '',
      data: { uid: this.currentUserUid },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.created && result.channelId && result.channelName) {
        this.openAddPeopleDialog(result.channelId, result.channelName);
        this.showAddPeopleDialog = true;
      }
    });
  }

  openAddPeopleDialog(channelId: string, channelName: string) {
    this.createdChannelId = channelId;
    this.createdChannelName = channelName;
    this.showAddPeopleDialog = true;
  }

  selectChannel(ch: Channel) {
    if (!ch.id) return;

    this.chatContext.openChannel(ch.id);

    if (this.isMobile) {
      this.mobileViewChange.emit('chat');
    }

    this.clearSearchIfActive();
  }

  openNewMessage() {
    this.chatContext.openNewMessage();
  }

  openDirectMessage(user: User) {
    if (!user.uid) return;
    this.chatContext.openConversation(user.uid);
    if (this.isMobile) {
      this.mobileViewChange.emit('chat');
    }
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

  // ========== NEU: Message selection methods ==========
  selectMessage(msg: MessageSearchResult) {
    if (msg.contextType === 'channel') {
      this.chatContext.openChannel(msg.contextId);
    } else {
      this.chatContext.openConversation(msg.senderId);
    }
    
    if (this.isMobile) {
      this.mobileViewChange.emit('chat');
    }
    
    setTimeout(() => {
      this.scrollToMessage(msg.id);
    }, 500);
    
    this.clearSearchIfActive();
  }

  private scrollToMessage(messageId: string): void {
    const element = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
      }, 2000);
    }
  }

  getMessageSnippet(text: string, maxLength: number = 60): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  getAvatarSrcById(userId: string): string {
    const user = this.firestore.userList().find(u => u.uid === userId);
    if (!user) return '/assets/images/avatars/avatar_default.svg';
    return this.getAvatarPath(user);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAddPeopleDone(event: { mode: 'all' | 'specific'; channelId: string; userIds: string[] }) {
    this.showAddPeopleDialog = false;

    if (event.mode === 'all') {
      const allUserIds = this.firestore
        .userList()
        .map((u) => u.uid!)
        .filter(Boolean);

      this.channelService.addMembersToChannel(event.channelId, allUserIds);
    } else {
      // specific
      this.channelService.addMembersToChannel(event.channelId, event.userIds);
    }
    this.chatContext.openChannel(event.channelId);

    if (this.isMobile) {
      this.mobileViewChange.emit('chat');
    }
  }

  onDrawerToggle() {
    // Toggle drawer HIER
    this.drawer.toggle();

    // Emit Zustand nach Toggle
    setTimeout(() => {
      this.workspaceToggle.emit(this.drawer.opened);
    }, 50);
  }
}