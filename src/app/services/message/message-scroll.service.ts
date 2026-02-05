import { Injectable, ElementRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MessageScrollService {

  scrollToBottom(
    bottomElement: ElementRef<HTMLDivElement> | undefined,
    isThreadContext: boolean,
    retry: boolean = true
  ): void {
    if (!bottomElement) {
      if (retry) {
        setTimeout(() => this.scrollToBottom(bottomElement, isThreadContext, false), 50);
      }
      return;
    }

    let container: HTMLElement | null = bottomElement.nativeElement.parentElement;

    while (container) {
      const hasScroll = container.scrollHeight > container.clientHeight;

      if (hasScroll && container.classList.contains('messages-scroll')) {
        const isInThread = this.isInThreadMenu(container);

        if (isInThread === isThreadContext) {
          this.animateScrollToBottom(container);
        }
        return;
      }

      container = container.parentElement;
    }
  }

  private animateScrollToBottom(scrollContainer: HTMLElement): void {
    const targetScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    const startScroll = scrollContainer.scrollTop;
    const distance = targetScroll - startScroll;
    const startTime = performance.now();
    this.performScrollAnimation(scrollContainer, startScroll, distance, startTime);
  }

  private performScrollAnimation(
    container: HTMLElement,
    startScroll: number,
    distance: number,
    startTime: number
  ): void {
    const animate = (currentTime: number) => {
      const progress = this.calculateProgress(currentTime, startTime);
      container.scrollTop = startScroll + (distance * progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  private calculateProgress(currentTime: number, startTime: number): number {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / 300, 1);
    return 1 - Math.pow(1 - progress, 3);
  }

  private isInThreadMenu(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current) {
      if (current.tagName === 'APP-THREAD-MENU') {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }
}