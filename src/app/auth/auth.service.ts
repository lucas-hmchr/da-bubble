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
import {
  Firestore,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from '@angular/fire/firestore';
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
  private router = inject(Router);
  googleProvider = new GoogleAuthProvider();
  private toast = inject(ToastService);

  readonly activeUser = toSignal<User | null>(this.user$, { initialValue: null });
  readonly isLoggedIn = computed(() => !!this.activeUser());
  readonly uid = computed(() => this.activeUser()?.uid ?? null);

  private readonly availableAvatars: AvatarId[] = [
    'avatar_female_1',
    'avatar_female_2',
    'avatar_male_1',
    'avatar_male_2',
    'avatar_male_3',
    'avatar_male_4',
  ];

  guestUser = {
    name: "Max Mustermann",
    email: "guest@da-bubble.de",
    password: "Guest-Bubble"
  }

  async register(
    email: string,
    password: string,
    displayName: string,
    avatarId: AvatarId,
  ): Promise<void> {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      await this.createUserDocForNewUser(cred.user, { avatarId, displayName });
      this.toast.show('Konto erfolgreich erstellt!', 4000);
      this.router.navigate(['/']);
    } catch (error) {
      this.toast.show('Bei der Registrierung ist ein Fehler aufgetreten!');
    }
  }

  getUserRef(uid: string = this.activeUser()!.uid) {
    const userRef = doc(this.firestore, 'users', uid);
    return userRef;
  }

  async fixExistingUserAvatars() {
    const usersRef = collection(this.firestore, 'users');
    const snapshot = await getDocs(usersRef);

    const updates: Promise<void>[] = [];

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();

      if (!data['avatarId'] || data['avatarId'] === 'avatar_default') {
        const randomId = this.getRandomAvatarId();
        updates.push(updateDoc(docSnap.ref, { avatarId: randomId }));
      }
    });

    await Promise.all(updates);
    this.toast.show(`${updates.length} Avatare aktualisiert!`, 4000);
  }

  private async createUserDocForNewUser(
    user: User,
    opts?: { avatarId?: string; displayName?: string; isGuest?: boolean },
  ) {
    const { avatarId, isGuest, displayName } = opts ?? {};
    const ref = this.getUserRef(user.uid);
    const finalAvatarId = avatarId ?? this.getRandomAvatarId();

    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? null,
      displayName: displayName ?? (isGuest ? 'Gast' : null),
      avatarId: finalAvatarId,
      isGuest: !!isGuest,
      isOnline: true,
      lastActiveAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }

  private getRandomAvatarId(): AvatarId {
    const randomIndex = Math.floor(Math.random() * this.availableAvatars.length);
    return this.availableAvatars[randomIndex];
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(['/']);
      this.toast.show('Du bist jetzt eingeloggt!', 4000, 'assets/icons/global/send.svg');
      await this.markMeOnline(cred.user.uid);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      const cred = await signInWithPopup(this.auth, this.googleProvider);
      const user = cred.user;
      const snap = await getDoc(this.getUserRef(user.uid));
      await this.markMeOnline(user.uid);
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
    const { email, password } = this.guestUser;

    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, password);
      await this.markMeOnline(cred.user.uid);
      this.toast.show('Du bist als Gast eingeloggt!', 4000);
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Guest Login Fehler:', error);
      this.toast.show('Gast-Login fehlgeschlagen.');
    }
  }

  // async loginAsGuest(): Promise<void> {
  //   const cred = await signInAnonymously(this.auth);
  //   const user = cred.user;
  //   const ref = this.getUserRef(user.uid);
  //   const snap = await getDoc(ref);
  //   if (!snap.exists()) {
  //     await this.createUserDocForNewUser(user, { isGuest: true });
  //   } else {
  //     await setDoc(ref, { lastActiveAt: serverTimestamp() }, { merge: true });
  //   }
  //   await this.markMeOnline(cred.user.uid);
  //   this.router.navigate(['/']);
  // }

  async logout(): Promise<void> {
    const user = this.activeUser();

    if (user) {
      const ref = this.getUserRef(user.uid);
      await setDoc(
        ref,
        {
          isOnline: false,
          lastActiveAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    await signOut(this.auth);
    this.router.navigate(['/auth']);
  }

  async resetPassword(email: string): Promise<'ok' | 'user-not-found'> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      this.toast.show('E-Mail gesendet!', 4000, 'assets/icons/global/send.svg');
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
      // this.toast.show('Dein Name ist erfolgreich geändert worden!');
      this.toast.show('Änderungen gespeichert!');
    } catch (err) {
      console.error(err);

    }
  }

  public async pingUser() {
    if (!this.activeUser()) return;
    try {
      await updateDoc(this.getUserRef(), {
        lastActiveAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }
  }

  private async markMeOnline(uid: string) {
    const ref = this.getUserRef(uid);
    await setDoc(ref, {
      isOnline: true,
      lastActiveAt: serverTimestamp(),
      lastActiveClientAt: Date.now(),
    }, { merge: true });
  }

}
