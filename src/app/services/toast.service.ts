import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    private _toast = signal<String | null>(null);
    readonly toast = this._toast.asReadonly();

    private hideTimeout: any = null;

    show(message: string, duration: number = 3000) {
        if (this.hideTimeout) {
            this.resetTimeout()
        }
        this._toast.set(message);
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