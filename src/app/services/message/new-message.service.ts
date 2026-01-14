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
            this.users.set(u);
            this.filteredUsers.set(u);
        });

        this.mi.loadChannels().subscribe((c) => {
            this.channels.set(c);
            this.filteredChannels.set(c);
        });
    }

    setQuery(value: string) {
        this.query.set(value);

        const trimmed = value.trim();
        const firstChar = trimmed.slice(0, 1);
        const lastChar = value.slice(-1);

        if (lastChar === '@' || lastChar === '#') {
            const nextMode: Mode = lastChar === '@' ? 'user' : 'channel';
            this.mode.set(nextMode);
            this.show.set(true);
            this.target.set(null);
            this.filteredUsers.set(this.users());
            this.filteredChannels.set(this.channels());
            return;
        }

        if (firstChar !== '@' && firstChar !== '#') {
            this.resetDropdown();
            return;
        }

        this.mode.set(firstChar === '@' ? 'user' : 'channel');

        if (this.mode() === 'user') {
            const res = this.mi.filterUsersByQuery(this.users(), value);
            if (res === null) return this.resetDropdown();
            this.filteredUsers.set(res);
            this.show.set(true);
            return;
        }

        const res = this.mi.filterChannelsByQuery(this.channels(), value);
        if (res === null) return this.resetDropdown();
        this.filteredChannels.set(res);
        this.show.set(true);
    }

    selectUser(u: User) {
        if (!u.uid) {
            return;
        }

        const label = u.displayName ?? u.name ?? '';
        this.query.set(`@${label}`);
        this.target.set({ type: 'user', id: u.uid });
        this.resetDropdown();
    }

    selectChannel(ch: Channel) {
        if (!ch.id) {
            return;
        }

        const label = ch.name ?? '';
        this.query.set(`#${label}`);
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
        if (t.type === 'channel') {
            return await this.sendToChannel(t.id, text, senderId);
        }
        return await this.sendToConversation(t.id, text, senderId);
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