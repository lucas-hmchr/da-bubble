import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously,
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Firestore, doc, getDoc, serverTimestamp, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { AvatarId } from '../../shared/data/avatars';

@Injectable({
    providedIn: 'root',
})

export class AuthService {
    private auth = inject(Auth);
    private user$ = user(this.auth);
    private firestore = inject(Firestore);
    private router = inject(Router)
    googleProvider = new GoogleAuthProvider();
    private toast = inject(ToastService);

    readonly activeUser = toSignal<User | null>(this.user$, { initialValue: null });
    readonly isLoggedIn = computed(() => !!this.activeUser());
    readonly uid = computed(() => this.activeUser()?.uid ?? null);

    async register(email: string, password: string, displayName: string, avatarId: AvatarId): Promise<void> {
        try {
            const cred = await createUserWithEmailAndPassword(this.auth, email, password);
            await this.createUserDocForNewUser(cred.user, { avatarId, displayName });
            this.toast.show('Konto erfolgreich erstellt!', 4000)
            this.router.navigate(['/'])
        } catch (error) {
            console.log(error)
            this.toast.show('Bei der Registrierung ist ein Fehler aufgetreten!')
        }
    }

    getUserRef(uid: string = this.activeUser()!.uid) {
        const userRef = doc(this.firestore, 'users', uid);
        return userRef;
    }

    private async createUserDocForNewUser(
        user: User,
        opts?: { avatarId?: string, displayName?: string, isGuest?: boolean }
    ) {
        const { avatarId, isGuest, displayName } = opts ?? {};
        const ref = this.getUserRef(user.uid);
        await setDoc(ref, {
            uid: user.uid,
            email: user.email ?? null,
            displayName: displayName ?? (isGuest ? 'Gast' : null),
            avatarId: avatarId ?? (isGuest ? 'avatar_default' : null),
            isGuest: !!isGuest,
            isOnline: true,
            createdAt: serverTimestamp(),
        });
    }

    async login(email: string, password: string): Promise<void> {
        try {
            await signInWithEmailAndPassword(this.auth, email, password);
            this.router.navigate(['/']);
            this.toast.show('Du bist jetzt eingeloggt!', 4000, '/icons/global/send.svg')
        } catch (error) {
            console.log(error)
        }
    }

    async signInWithGoogle(): Promise<void> {
        try {
            const cred = await signInWithPopup(this.auth, this.googleProvider);
            const user = cred.user;
            const snap = await getDoc(this.getUserRef(user.uid));
            if (!snap.exists()) {
                await this.createUserDocForNewUser(user, {
                    displayName: user.displayName ?? undefined,
                });
            }
            this.router.navigate(['/']);
        } catch (error: any) {
            console.error('Google Login Fehler:', error);
            throw error;
        }
    }

    async loginAsGuest(): Promise<void> {
        const cred = await signInAnonymously(this.auth);
        const user = cred.user;
        const ref = this.getUserRef(user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await this.createUserDocForNewUser(user, { isGuest: true });
        } else {
            await setDoc(
                ref,
                { lastActiveAt: serverTimestamp() },
                { merge: true },
            );
        }
        this.router.navigate(['/']);
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
        this.router.navigate(['/auth']);
    }

    async resetPassword(email: string): Promise<'ok' | 'user-not-found'> {
        try {
            await sendPasswordResetEmail(this.auth, email);
            this.toast.show('E-Mail gesendet!', 4000, '/icons/global/send.svg')
            return 'ok';
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                return 'user-not-found';
            }
            throw error;
        }
    }

    async updateUserName(newName: string) {
        if (!this.activeUser()) return;
        if (!newName.trim()) return;
        try {
            await updateDoc(this.getUserRef(), {
                displayName: newName.trim(),
            });
            this.toast.show('Dein Name ist erfolgreich geändert worden!');
        } catch (err) {
            console.log(err);
        }
    }

}