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
        this.router.navigate(['/auth'])
    }

    getUserRef(uid: string = this.activeUser()!.uid) {
        const userRef = doc(this.firestore, 'users', uid);
        return userRef;
    }

    private async createUserDocForNewUser(user: User, opts?: { avatarName?: string }) {
        const { avatarName } = opts ?? {};
        const ref = this.getUserRef(user.uid);

        await setDoc(ref, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            avatarName: avatarName ?? null,
            isOnline: false,
            createdAt: serverTimestamp(),
        });
    }

    async login(email: string, password: string): Promise<void> {
        await signInWithEmailAndPassword(this.auth, email, password);
    }

    async signInWithGoogle(): Promise<void> {
        try {
            const cred = await signInWithPopup(this.auth, this.googleProvider);
            const user = cred.user;
            const snap = await getDoc(this.getUserRef(user.uid));
            if (!snap.exists()) {
                await this.createUserDocForNewUser(user);
            }
            this.router.navigate(['/']);
        } catch (error: any) {
            console.error('Google Login Fehler:', error);
            throw error;
        }
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