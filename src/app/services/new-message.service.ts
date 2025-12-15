import { Injectable, computed, signal } from '@angular/core';
import { MessageInputService } from './message-intput.service';
import { User } from '../models/user.model';
import { Channel } from '../models/channel.interface';

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

    constructor(private mi: MessageInputService) {
        // Daten laden (einmal)
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

        // Trigger startet Modus
        if (lastChar === '@' || lastChar === '#') {
            const nextMode: Mode = lastChar === '@' ? 'user' : 'channel';
            this.mode.set(nextMode);
            this.show.set(true);
            this.target.set(null);
            this.filteredUsers.set(this.users());
            this.filteredChannels.set(this.channels());
            return;
        }

        // Ohne gültigen Prefix -> Dropdown zu
        if (firstChar !== '@' && firstChar !== '#') {
            this.resetDropdown();
            return;
        }

        // Modus setzen anhand Prefix (falls Nutzer direkt tippt ohne letzten Trigger)
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
            console.warn('User ohne uid kann nicht ausgewählt werden.');
            return;
        }

        const label = u.displayName ?? u.name ?? '';
        this.query.set(`@${label}`);
        this.target.set({ type: 'user', id: u.uid });
        this.resetDropdown();
    }


    selectChannel(ch: Channel) {
        if (!ch.id) {
            console.warn('Channel ohne id kann nicht ausgewählt werden.');
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
}
