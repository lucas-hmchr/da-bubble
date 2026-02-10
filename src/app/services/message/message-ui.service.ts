import { Injectable, signal } from '@angular/core';
import { ReactionId } from '../../../shared/data/reactions';

@Injectable({ providedIn: 'root' })
export class MessageUiService {
  private reactionPickerForMessageId = signal<string | null>(null);
  private optionsMenuForMessageId = signal<string | null>(null);
  private optionsMenuOpenUp = signal(false);
  private isOptionsMenuHovered = signal(false);
  private hoveredReaction = signal<ReactionId | null>(null);
  private hoveredMessageId = signal<string | null>(null);

  getReactionPickerMessageId(): string | null {
    return this.reactionPickerForMessageId();
  }

  toggleReactionPicker(messageId: string, context?: string): void {
    const uniqueId = context ? `${context}-${messageId}` : messageId;
    const current = this.reactionPickerForMessageId();
    this.reactionPickerForMessageId.set(current === uniqueId ? null : uniqueId);
  }

  closeReactionPicker(): void {
    this.reactionPickerForMessageId.set(null);
  }

  getOptionsMenuMessageId(): string | null {
    return this.optionsMenuForMessageId();
  }

  isOptionsMenuOpenUp(): boolean {
    return this.optionsMenuOpenUp();
  }

  setOptionsMenuOpenUp(value: boolean): void {
    this.optionsMenuOpenUp.set(value);
  }

  toggleOptionsMenu(messageId: string, context?: string): void {
    const uniqueId = context ? `${context}-${messageId}` : messageId;
    const current = this.optionsMenuForMessageId();
    if (current === uniqueId) {
      this.closeOptionsMenu();
    } else {
      this.optionsMenuForMessageId.set(uniqueId);
    }
  }

  closeOptionsMenu(): void {
    this.optionsMenuForMessageId.set(null);
    this.optionsMenuOpenUp.set(false);
    this.isOptionsMenuHovered.set(false);
  }

  setOptionsMenuHovered(hovered: boolean): void {
    this.isOptionsMenuHovered.set(hovered);
  }

  getIsOptionsMenuHovered(): boolean {
    return this.isOptionsMenuHovered();
  }

  setHoveredReaction(messageId: string | null, reactionId: ReactionId | null): void {
    this.hoveredMessageId.set(messageId);
    this.hoveredReaction.set(reactionId);
  }

  getHoveredReaction(): { messageId: string | null; reactionId: ReactionId | null } {
    return {
      messageId: this.hoveredMessageId(),
      reactionId: this.hoveredReaction()
    };
  }

  closeAllOverlays(): void {
    this.reactionPickerForMessageId.set(null);
    this.optionsMenuForMessageId.set(null);
    this.hoveredReaction.set(null);
    this.hoveredMessageId.set(null);
  }

  getUniqueMessageId(msg: any, isThreadContext: boolean): string | null {
    if (!msg.id) return null;
    return isThreadContext ? `thread-${msg.id}` : `view-${msg.id}`;
  }

  isLastMessage(msg: any, messages: any[]): boolean {
    if (!msg.id || messages.length <= 1) return false;
    const lastMsg = messages[messages.length - 1];
    return msg.id === lastMsg.id;
  }

  calculateMenuPosition(event: MouseEvent): void {
    queueMicrotask(() => {
      const btn = event.currentTarget as HTMLElement | null;
      if (!btn) return;
      const scroll = btn.closest('.messages-scroll') as HTMLElement | null;
      const menu = scroll?.querySelector('.message-options-menu') as HTMLElement | null;
      const menuHeight = menu?.getBoundingClientRect().height ?? 160;
      const btnRect = btn.getBoundingClientRect();
      const scrollRect = (scroll ?? document.documentElement).getBoundingClientRect();
      const spaceBelow = scrollRect.bottom - btnRect.bottom;
      const spaceAbove = btnRect.top - scrollRect.top;
      const openUp = spaceBelow < (menuHeight + 12) && spaceAbove > (menuHeight + 12);
      this.setOptionsMenuOpenUp(openUp);
    });
  }
}