import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, authState, user } from '@angular/fire/auth';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    UserCredential,
    signInAnonymously,
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Firestore, doc, getDoc, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})

export class AuthService {
    private auth = inject(Auth);
    private user$ = user(this.auth);
    private firestore = inject(Firestore);
    private router = inject(Router)
    googleProvider = new GoogleAuthProvider();

    readonly activeUser = toSignal<User | null>(this.user$, { initialValue: null });
    readonly isLoggedIn = computed(() => !!this.activeUser());
    readonly uid = computed(() => this.activeUser()?.uid ?? null);

    async register(email: string, password: string, displayName: string, avatarName: string): Promise<void> {
        const cred = await createUserWithEmailAndPassword(this.auth, email, password);
        await updateProfile(cred.user, {
            displayName,
            photoURL: `/images/avatars/${avatarName}.svg`,
        });
        await this.createUserDocForNewUser(cred.user, { avatarName });
        this.router.navigate(['/'])
    }

    getUserRef(uid: string = this.activeUser()!.uid) {
        const userRef = doc(this.firestore, 'users', uid);
        return userRef;
    }

    private async createUserDocForNewUser(
        user: User,
        opts?: { avatarName?: string; isGuest?: boolean }
    ) {
        const { avatarName, isGuest } = opts ?? {};
        const ref = this.getUserRef(user.uid);
        await setDoc(ref, {
            uid: user.uid,
            email: user.email ?? null,
            displayName: user.displayName ?? (isGuest ? 'Gast' : null),
            avatarName: avatarName ?? (isGuest ? 'avatar_default' : null),
            isGuest: !!isGuest,
            isOnline: true,
            createdAt: serverTimestamp(),
        });
    }

    async login(email: string, password: string): Promise<void> {
        try {
            await signInWithEmailAndPassword(this.auth, email, password);
            this.router.navigate(['/']);
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
                await this.createUserDocForNewUser(user);
            }
            console.log('activeUser', this.activeUser());
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
            return 'ok';
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                return 'user-not-found';
            }
            throw error;
        }
    }

}