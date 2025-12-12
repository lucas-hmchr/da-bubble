import { Injectable, inject, signal } from '@angular/core';
import {
    DocumentReference,
    Firestore,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { FirestoreService } from "./firestore";
import { MessageData } from '../models/message.interface';
import { User } from './../models/user.model';
import { AuthService } from '../auth/auth.service';

export interface Conversation {
    id?: string;
    participants: string[];
    createdAt: any;
    lastMessageAt?: any;
}

@Injectable({ providedIn: 'root' })

export class ConversationService {
    private ngFirestore = inject(Firestore);

    private convSub?: Subscription;
    private messagesSub?: Subscription;

    activeConversationId = signal<string | null>(null);
    activeConversationPartner = signal<User | null>(null);
    activeConversationMessages = signal<MessageData[]>([]);

    constructor(private firestore: FirestoreService,  private authService: AuthService) { }

    subscribeToConversation(convId: string) {
        this.cleanup();
        this.activeConversationId.set(convId);
        this.messagesSub = this.getConversationMessages(convId)
            .subscribe(msgs => {
                this.activeConversationMessages.set(msgs);
            });
    }

    setConvPartner(user: User) {
        this.activeConversationPartner.set(user)
    }

    cleanup() {
        this.convSub?.unsubscribe();
        this.messagesSub?.unsubscribe();
    }

    buildConversationId(userA: string, userB: string): string {
        return [userA, userB].sort().join('_');
    }

    async getOrCreateConversationId(currentUserId: string, otherUserId: string): Promise<string> {
        const convId = this.buildConversationId(currentUserId, otherUserId);
        const convRef = doc(this.ngFirestore, `conversations/${convId}`);
        const snapshot = await getDoc(convRef);
        if (!snapshot.exists()) {
            this.createConv(currentUserId, otherUserId, convId, convRef)
        }
        return convId;
    }

    private async createConv(currentUserId: string, otherUserId: string, convId: string, convRef: DocumentReference) {
        const now = serverTimestamp();
        const conversation: Conversation = {
            id: convId,
            participants: [currentUserId, otherUserId],
            createdAt: now,
            lastMessageAt: now,
        };
        await setDoc(convRef, conversation);
    }

    getConversationMessages(conversationId: string): Observable<MessageData[]> {
        return this.firestore.getSubcollection<MessageData>(
            'conversations',
            conversationId,
            'messages',
            'createdAt'
        );
    }

    updateConversationLastMessage(
        conversationId: string,
        date: Date
    ): Promise<void> {
        return this.firestore.updateDocument('conversations', conversationId, {
            lastMessageAt: date,
        });
    }
}
