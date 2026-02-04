import { Injectable, signal, inject } from '@angular/core';
import { MessageInputService } from './message-intput.service';
import { User } from '../../models/user.model';
import { Channel } from '../../models/channel.interface';
import { ChatContextService } from './../chat-context.service';
import { AuthService } from '../../auth/auth.service';
import { ConversationService } from './../conversation.service';
import { Router } from '@angular/router';

type Mode = 'user' | 'channel' | null;
type Target = { type: 'user' | 'channel'; id: string } | null;

@Injectable({ providedIn: 'root' })
export class NewMessageService {
    private users = signal<User[]>([]);
    private channels = signal<Channel[]>([]);

    query = signal<string>('');
    mode = signal<Mode>(null);
    show = signal<boolean>(false);
    target = signal<Target>(null);

    filteredUsers = signal<User[]>([]);
    filteredChannels = signal<Channel[]>([]);

    private chatContext = inject(ChatContextService);
    private auth = inject(AuthService);
    private conversations = inject(ConversationService);
    private router = inject(Router);

    constructor(private mi: MessageInputService) {
        this.mi.loadUsers().subscribe((u) => {
            const usersWithNames = u.filter(user => user.displayName || user.name);
            this.users.set(usersWithNames);
            
            if (!this.show() && !this.query()) {
                this.filteredUsers.set(usersWithNames);
            }
        });

        this.mi.loadChannels().subscribe((c) => {
            const memberChannels = this.filterMemberChannels(c);
            this.channels.set(memberChannels);
            
            if (!this.show() && !this.query()) {
                this.filteredChannels.set(memberChannels);
            }
        });
    }

    private filterMemberChannels(channels: Channel[]): Channel[] {
        const currentUid = this.auth.activeUser()?.uid;
        return currentUid 
            ? channels.filter(ch => ch.members && ch.members.includes(currentUid))
            : [];
    }

    setQuery(value: string) {
        this.query.set(value);

        const trimmed = value.trim();
        const firstChar = trimmed.slice(0, 1);
        const lastChar = value.slice(-1);

        if (this.handleNameOrEmailSearch(trimmed)) return;
        if (this.handleLastCharTrigger(lastChar)) return;
        if (this.handlePrefixSearch(firstChar, value)) return;
        
        this.resetDropdown();
    }

    private handleNameOrEmailSearch(trimmed: string): boolean {
        const isNameOrEmailSearch = trimmed.length >= 3 && 
                                    !trimmed.startsWith('@') && 
                                    !trimmed.startsWith('#');

        if (!isNameOrEmailSearch) return false;

        this.mode.set('user');
        const res = this.filterUsersByNameOrEmail(trimmed.toLowerCase());
        this.filteredUsers.set(res);
        this.show.set(res.length > 0);
        return true;
    }

    private filterUsersByNameOrEmail(searchQuery: string): User[] {
        return this.users().filter(u => {
            const nameMatch = (u.displayName || u.name || '').toLowerCase().includes(searchQuery);
            const emailMatch = u.email && u.email.toLowerCase().includes(searchQuery);
            return nameMatch || emailMatch;
        });
    }

    private handleLastCharTrigger(lastChar: string): boolean {
        if (lastChar !== '@' && lastChar !== '#') return false;

        const nextMode: Mode = lastChar === '@' ? 'user' : 'channel';
        this.mode.set(nextMode);
        this.show.set(true);
        this.target.set(null);
        
        if (nextMode === 'user') {
            this.filteredUsers.set(this.users().filter(u => u.displayName || u.name));
        } else {
            this.filteredChannels.set(this.channels());
        }
        return true;
    }

    private handlePrefixSearch(firstChar: string, value: string): boolean {
        if (firstChar !== '@' && firstChar !== '#') return false;

        this.mode.set(firstChar === '@' ? 'user' : 'channel');

        if (this.mode() === 'user') {
            return this.searchUsers(value);
        }
        return this.searchChannels(value);
    }

    private searchUsers(value: string): boolean {
        const res = this.mi.filterUsersByQuery(this.users(), value);
        if (res === null) {
            this.resetDropdown();
            return false;
        }
        this.filteredUsers.set(res);
        this.show.set(true);
        return true;
    }

    private searchChannels(value: string): boolean {
        const res = this.mi.filterChannelsByQuery(this.channels(), value);
        if (res === null) {
            this.resetDropdown();
            return false;
        }
        this.filteredChannels.set(res);
        this.show.set(true);
        return true;
    }

    selectUser(u: User) {
        if (!u.uid) return;

        const isEmailSearch = this.isEmailSearch();
        const queryValue = isEmailSearch ? (u.email || '') : `@${u.displayName ?? u.name ?? ''}`;
        
        this.query.set(queryValue);
        this.target.set({ type: 'user', id: u.uid });
        this.resetDropdown();
    }

    private isEmailSearch(): boolean {
        const currentQuery = this.query().trim();
        return currentQuery.includes('@') && !currentQuery.startsWith('@');
    }

    selectChannel(ch: Channel) {
        if (!ch.id) return;

        this.query.set(`#${ch.name ?? ''}`);
        this.target.set({ type: 'channel', id: ch.id });
        this.resetDropdown();
    }

    resetDropdown() {
        this.show.set(false);
        this.mode.set(null);
    }

    resetAll() {
        this.query.set('');
        this.target.set(null);
        this.resetDropdown();
        this.filteredUsers.set(this.users());
        this.filteredChannels.set(this.channels());
    }


    hasTarget(): boolean {
        return this.target() !== null;
    }

    async sendAndNavigate(messageText: string): Promise<boolean> {
        const text = messageText.trim();
        if (!text) return false;
        
        const t = this.target();
        if (!t) return false;
        
        const senderId = this.auth.activeUser()?.uid;
        if (!senderId) return false;
        
        return t.type === 'channel' 
            ? await this.sendToChannel(t.id, text, senderId)
            : await this.sendToConversation(t.id, text, senderId);
    }

    private async sendToChannel(channelId: string, text: string, senderId: string): Promise<boolean> {
        await this.mi.sendChannelMessage(channelId, text, senderId);
        this.chatContext.openChannel(channelId);
        this.resetAll();
        return true;
    }

    private async sendToConversation(userId: string, text: string, senderId: string): Promise<boolean> {
        const convId = await this.conversations.getOrCreateConversationId(senderId, userId);
        await this.mi.sendConversationMessage(convId, text, senderId);
        await this.chatContext.openConversationByConvId(convId);
        this.resetAll();
        return true;
    }

}