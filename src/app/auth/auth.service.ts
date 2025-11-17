import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, authState, user } from '@angular/fire/auth';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    User,
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Firestore, doc, serverTimestamp, setDoc } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root',
})

export class AuthService {
    private auth = inject(Auth);
    private user$ = user(this.auth);
    private firestore = inject(Firestore);

    readonly userSignal = toSignal<User | null>(this.user$, { initialValue: null });
    readonly isLoggedIn = computed(() => !!this.userSignal());
    readonly uid = computed(() => this.userSignal()?.uid ?? null);

    async register(email: string, password: string, displayName: string, avatarName: string): Promise<User> {
        const cred = await createUserWithEmailAndPassword(this.auth, email, password);
        await updateProfile(cred.user, {
            displayName,
            photoURL: `/images/avatars/${avatarName}.svg`,
        });
        const userRef = doc(this.firestore, 'users', cred.user.uid)
        await setDoc(userRef, {
            uid: cred.user.uid,
            email,
            displayName,
            createdAt: serverTimestamp(),
        });
        return cred.user;
    }

    async login(email: string, password: string): Promise<User> {
        const cred = await signInWithEmailAndPassword(this.auth, email, password);
        return cred.user;
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
    }

    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(this.auth, email);
    }
}