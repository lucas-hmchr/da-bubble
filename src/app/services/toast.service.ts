import { Injectable, signal } from '@angular/core';
import { ToastModel } from './../models/toast.model'

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    private _toast = signal<ToastModel | null>(null);
    readonly toast = this._toast.asReadonly();

    private hideTimeout: any = null;

    show(message: string, duration: number = 3000, icon?: string) {
        if (this.hideTimeout) {
            this.resetTimeout()
        }
        this._toast.set({
            "message": message, 
            "icon": icon! ?? null,
        });
        if (duration && duration > 0) {
            this.hideTimeout = setTimeout(() => {
                this.hide()
            }, duration)
        }
    }

    resetTimeout() {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
    }

    hide() {
        this._toast.set(null);
        if (this.hideTimeout) {
            this.resetTimeout()
        }
    }
}