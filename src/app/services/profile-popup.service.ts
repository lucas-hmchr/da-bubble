import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserService } from './user.service';
import { User } from '../models/user.model';
import { getAvatarById } from '../../shared/data/avatars';
import { Router } from '@angular/router';
import { ChatContextService } from './chat-context.service';
import { ConversationService } from './conversation.service';
import { ChannelInfoService } from './channel-info.service';

@Injectable({ providedIn: 'root' })
export class ProfilePopupService {
    isOpen = signal(false);
    uid = signal<string | null>(null);
    user = signal<User | null>(null);
    loading = signal(false);
    router = inject(Router);
    private channelInfoService = inject(ChannelInfoService);

    constructor(public userService: UserService, private chatCtx: ChatContextService, private coversationService: ConversationService) { }

    async open(uid: string) {
        this.uid.set(uid);
        this.isOpen.set(true);
        this.loading.set(true);
        this.user.set(null);
        try {
            const u = await firstValueFrom(this.userService.getUserByUid(uid));
            this.user.set(u ?? null);
        } finally {
            this.loading.set(false);
        }
    }

    close() {
        this.isOpen.set(false);
        this.uid.set(null);
        this.user.set(null);
        this.loading.set(false);
    }

    getAvatarSrc(): string {
        if (this.user()?.avatarId) {
            return getAvatarById(this.user()!.avatarId).src;
        }
        return '/images/avatars/avatar_default.svg';
    }

    navigateToChat() {
        const u = this.user();
        const uid = u?.uid;
        if (!uid) return;

        this.chatCtx.openConversation(uid);
        this.close();

        // Channel-Info auch schließen
        if (this.channelInfoService.isOpen()) {
            this.channelInfoService.close();
        }
    }


}
