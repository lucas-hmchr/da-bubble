import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({
      projectId: "da-bubble-bc7ad",
      appId: "1:558692292679:web:87a82ca7d82e5672717962",
      storageBucket: "da-bubble-bc7ad.firebasestorage.app",
      apiKey: "AIzaSyDDWhyr7gKX_0CraOyxFxwgdIYhLRk-fBM",
      authDomain: "da-bubble-bc7ad.firebaseapp.com",
      messagingSenderId: "558692292679"
    })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase())
  ]
};
