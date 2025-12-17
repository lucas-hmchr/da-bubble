import { Injectable, inject, signal, computed } from '@angular/core';
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
    private dmLoadedTimer: any = null;

    activeConversationId = signal<string | null>(null);
    activeConversationPartner = signal<User | null>(null);
    activeConversationMessages = signal<MessageData[]>([]);
    dmLoaded = signal<boolean>(false);

    constructor(private firestore: FirestoreService, private authService: AuthService) { }

    subscribeToConversation(convId: string) {
        this.cleanup();

        this.dmLoaded.set(false);
        this.activeConversationId.set(convId);

        let hasLoadedOnce = false;

        this.messagesSub = this.getConversationMessages(convId).subscribe((msgs) => {
            this.activeConversationMessages.set(msgs);

            const count = msgs?.length ?? 0;

            // ✅ Sobald Messages vorhanden sind: Timer stoppen + sofort "loaded"
            if (count > 0) {
                if (this.dmLoadedTimer) {
                    clearTimeout(this.dmLoadedTimer);
                    this.dmLoadedTimer = null;
                }
                if (!this.dmLoaded()) {
                    this.dmLoaded.set(true);
                }
                hasLoadedOnce = true;
                return;
            }

            // Ab hier: count === 0

            // Wenn wir bereits "loaded" sind, bleibt es loaded (wirklich leerer Chat)
            if (hasLoadedOnce) {
                if (!this.dmLoaded()) this.dmLoaded.set(true);
                return;
            }

            // Erste(n) leere(n) Snapshots: Timer (nur einmal) starten
            if (!this.dmLoadedTimer) {
                this.dmLoadedTimer = setTimeout(() => {
                    this.dmLoaded.set(true);
                    hasLoadedOnce = true;
                    this.dmLoadedTimer = null;
                }, 300); // etwas großzügiger als 150ms
            }
        });
    }


    setConvPartner(user: User) {
        this.activeConversationPartner.set(user)
    }

    cleanup() {
        this.convSub?.unsubscribe();
        this.messagesSub?.unsubscribe();

        this.convSub = undefined;
        this.messagesSub = undefined;

        if (this.dmLoadedTimer) {
            clearTimeout(this.dmLoadedTimer);
            this.dmLoadedTimer = null;
        }

        this.dmLoaded.set(false);
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

    // readonly dmLoaded = computed(() => this._dmLoaded());
}
