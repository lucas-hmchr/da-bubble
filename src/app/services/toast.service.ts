import { Injectable, signal } from '@angular/core';
import { ToastModel } from './../models/toast.model'

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    private _toast = signal<ToastModel | null>(null);
    readonly toast = this._toast.asReadonly();

    private _isClosing = signal(false);
    readonly isClosing = this._isClosing.asReadonly();

    private hideTimeout: any = null;

    show(message: string, duration: number = 3000, icon?: string) {
        if (this.hideTimeout) {
            this.resetTimeout()
        }
        this._isClosing.set(false);
        this._toast.set({ message, icon });
        if (duration && duration > 0) {
            this.hideTimeout = setTimeout(() => {
                this.startHide()
            }, duration)
        }
    }

    hide() {
        if (this.hideTimeout) {
            this.resetTimeout()
        }
        this.startHide();
    }

    private startHide() {
        this._isClosing.set(true);
        setTimeout(() => {
            this._toast.set(null);
            this._isClosing.set(false);
        }, 150);
    }

    resetTimeout() {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
    }
}
