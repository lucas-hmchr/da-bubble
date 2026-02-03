import { Injectable, signal, computed } from "@angular/core";
import { Channel } from "../models/channel.interface";
import { MessageData } from "../models/message.interface";
import { FirestoreService } from "./firestore";
import { Observable, Subscription } from "rxjs";
import { User } from "../models/user.model";
import { Timestamp } from 'firebase/firestore';


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
    canUserAccessChannel(channel: Channel, userId: string): boolean {
        if (!channel.isPrivate) return true;
        return channel.members.includes(userId);
    }
    isUserChannelAdmin(channel: Channel, userId: string): boolean {
        return channel.admins?.includes(userId) || channel.createdBy === userId;
    }
    getAccessibleChannels(userId: string): Channel[] {
        return this.channels().filter(channel => 
            this.canUserAccessChannel(channel, userId)
        );
    }
    subscribeSelectedChannel(id: string, userId: string) {
        this.cleanUp();
        this.activeChannelSub = this.getChannel(id).subscribe(ch => {
            if (ch && !this.canUserAccessChannel(ch, userId)) {
                console.error('Kein Zugriff auf diesen Channel');
                this.activeChannel.set(null);
                return;
            }
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

    async updateChannelName(channelId: string, newName: string): Promise<void> {
        try {
            await this.firestore.updateDocument('channels', channelId, {
                name: newName,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            throw error;
        }
    }

    async updateChannelDescription(channelId: string, newDescription: string): Promise<void> {
        try {
            await this.firestore.updateDocument('channels', channelId, {
                description: newDescription,
                updatedAt: Timestamp.now()
            });
        } catch (error) {
            throw error;
        }
    }

    async leaveChannel(channelId: string, userId: string): Promise<void> {
        try {

            // Hole aktuelles Channel-Dokument
            const channel = await this.getChannelById(channelId);

            if (!channel) {
                throw new Error('Channel not found');
            }

            // Aktuelle Members-Liste
            const currentMembers = (channel.members || []) as string[];

            // User aus Members entfernen
            const updatedMembers = currentMembers.filter(id => id !== userId);


            // Firebase updaten
            await this.firestore.updateDocument('channels', channelId, {
                members: updatedMembers,
                updatedAt: Timestamp.now()
            });


        } catch (error) {
            throw error;
        }
    }

    private async getChannelById(channelId: string): Promise<Channel | null> {
        return new Promise((resolve) => {
            const sub = this.getChannel(channelId).subscribe(channel => {
                sub.unsubscribe();
                resolve(channel || null);
            });
        });
    }

    async addMembersToChannel(channelId: string, userIds: string[]): Promise<void> {
  try {
    const channel = await this.getChannelById(channelId);

    if (!channel) {
      throw new Error('Channel not found');
    }

    const currentMembers = (channel.members || []) as string[];

    // 🔑 doppelte vermeiden
    const updatedMembers = Array.from(
      new Set([...currentMembers, ...userIds])
    );

    await this.firestore.updateDocument('channels', channelId, {
      members: updatedMembers,
      updatedAt: Timestamp.now()
    });

  } catch (error) {
    throw error;
  }
}

}
