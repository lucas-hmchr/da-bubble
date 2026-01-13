import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Channel } from '../models/channel.interface';

export interface MentionPosition {
  top: number;
  left: number;
  bottom: number;
}

@Injectable({ providedIn: 'root' })
export class MessageInputMentionService {

  createMirror(textarea: HTMLTextAreaElement, caretIndex: number): HTMLDivElement {
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    Array.from(style).forEach((name) => {
      mirror.style.setProperty(name, style.getPropertyValue(name));
    });
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.overflow = 'hidden';
    mirror.style.top = textarea.offsetTop + 'px';
    mirror.style.left = textarea.offsetLeft + 'px';
    mirror.style.width = textarea.clientWidth + 'px';
    mirror.textContent = textarea.value.substring(0, caretIndex);
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.appendChild(marker);
    return mirror;
  }

  calculateMentionPosition(containerEl: HTMLElement, mirror: HTMLElement): MentionPosition {
    containerEl.appendChild(mirror);
    const marker = mirror.lastElementChild as HTMLElement;
    const markerRect = marker.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    const position = {
      top: markerRect.bottom - containerRect.top + 8,
      left: markerRect.left - containerRect.left,
      bottom: containerRect.bottom - markerRect.top + 8,
    };
    containerEl.removeChild(mirror);
    return position;
  }

  getListLabel(user: User, currentUserUid: string | null): string {
    const baseName = user.displayName ?? user.name ?? '';
    if (currentUserUid && user.uid === currentUserUid) {
      return `${baseName} (Du)`;
    }
    return baseName;
  }

  getMentionLabel(user: User): string {
    return user.displayName ?? user.name ?? '';
  }

  replaceTriggerWithText(
    textarea: HTMLTextAreaElement,
    trigger: string,
    text: string
  ): void {
    const value = textarea.value;
    const lastIndex = value.lastIndexOf(trigger);
    if (lastIndex === -1) return;
    const before = value.slice(0, lastIndex);
    textarea.value = `${before}${trigger}${text} `;
    textarea.focus();
  }
}