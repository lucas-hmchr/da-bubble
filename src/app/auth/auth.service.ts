import { Injectable, computed, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

export class AuthService {
    constructor (private auth: Auth) {

    }

}