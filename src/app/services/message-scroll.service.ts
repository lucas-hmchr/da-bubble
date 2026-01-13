import { Injectable, ElementRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MessageScrollService {
  private isFirstLoad = true;
  private hasScrolledToBottom = false;

  resetScrollState(): void {
    this.isFirstLoad = true;
    this.hasScrolledToBottom = false;
  }

  shouldScrollToBottom(): boolean {
    return this.isFirstLoad || !this.hasScrolledToBottom;
  }

  scrollToBottom(bottomElement?: ElementRef<HTMLDivElement>): void {
    if (!bottomElement?.nativeElement) return;
    try {
      bottomElement.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
      this.hasScrolledToBottom = true;
      this.isFirstLoad = false;
    } catch (err) {
      console.warn('Scroll failed:', err);
    }
  }

  scrollToBottomInstant(bottomElement?: ElementRef<HTMLDivElement>): void {
    if (!bottomElement?.nativeElement) return;
    try {
      bottomElement.nativeElement.scrollIntoView({
        behavior: 'instant' as ScrollBehavior,
        block: 'end',
      });
      this.hasScrolledToBottom = true;
      this.isFirstLoad = false;
    } catch (err) {
      console.warn('Instant scroll failed:', err);
    }
  }
}