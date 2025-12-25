import { Injectable, signal, computed } from "@angular/core";
import { Channel } from "../models/channel.interface";
import { MessageData } from "../models/message.interface";
import { FirestoreService } from "./firestore";
import { Observable, Subscription } from "rxjs";
import { User } from "../models/user.model";

@Injectable({ providedIn: 'root' })

export class ChannelService {

    private activeChannelSub?: Subscription;
    private activeMessagesSub?: Subscription;
    private allChannelsSub?: Subscription;

    channels = signal<Channel[]>([]);
    activeChannel = signal<Channel | null>(null);
    channelMembers = computed<User[]>(() => {
        const channel = this.activeChannel();
        const users = this.firestore.userList();

        if (!channel?.members || users.length === 0) return [];

        const memberIds = channel.members as string[];
        return users.filter(u => !!u.uid && memberIds.includes(u.uid!));
    });
    activeChannelMessages = signal<MessageData[]>([]);
    readonly isActiveChannelEmpty = computed(() => this.activeChannelMessages().length === 0);

    constructor(private firestore: FirestoreService) {
        this.firestore.subscribeUsers();
        this.allChannelsSub = this.getAllChannels().subscribe(chs => {
            this.channels.set(chs);
        });
    }

    getAllChannels(): Observable<Channel[]> {
        return this.firestore.getCollection<Channel>('channels');
    }

    getChannel(id: string): Observable<Channel | undefined> {
        return this.firestore.getDocument<Channel>(`channels/${id}`);
    }

    getChannelMessages(channelId: string): Observable<MessageData[]> {
        return this.firestore.getSubcollection<MessageData>(
            'channels',
            channelId,
            'messages',
            'createdAt'
        );
    }

    updateChannelLastMessage(channelId: string, date: Date): Promise<void> {
        return this.firestore.updateDocument('channels', channelId, {
            lastMessageAt: date,
        });
    }

    subscribeSelectedChannel(id: string) {
        this.cleanUp();
        this.activeChannelSub = this.getChannel(id).subscribe(ch => {
            // this.activeChannel.set(ch ?? null);
            this.activeChannel.set(ch ? ({ ...ch, id } as Channel) : null);
        });
        this.activeMessagesSub = this.getChannelMessages(id).subscribe(msgs => {
            this.activeChannelMessages.set(msgs);
        });
    }

    cleanUp() {
        this.activeChannelSub?.unsubscribe();
        this.activeMessagesSub?.unsubscribe();
    }
}
