import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MessageInputEmojiService {

  insertEmojiAtCursor(textarea: HTMLTextAreaElement, emoji: string): void {
    textarea.focus();
    const cursorPos = textarea.selectionStart ?? 0;
    const currentValue = textarea.value;
    const newValue =
      currentValue.slice(0, cursorPos) +
      emoji +
      currentValue.slice(cursorPos);
    textarea.value = newValue;
    const newCursorPos = cursorPos + emoji.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  }

  shouldCloseEmojiPicker(target: HTMLElement): boolean {
    const isInsidePicker = target.closest('.emoji-picker');
    const isEmojiButton = target.closest('.icon-smile');
    return !isInsidePicker && !isEmojiButton;
  }
}