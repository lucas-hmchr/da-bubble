import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MessageInputCaretService {

  getTextContent(element: HTMLDivElement | undefined): string {
    if (!element) return '';
    return element.innerText || '';
  }

  getCaretPosition(element: HTMLDivElement | undefined): number {
    if (!element) return 0;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }

  setCaretPosition(element: HTMLDivElement | undefined, offset: number): void {
    if (!element) return;
    const range = document.createRange();
    const sel = window.getSelection();
    if (!sel) return;

    try {
      const textNode = this.getTextNodeAtOffset(element, offset);
      if (textNode.node) {
        range.setStart(textNode.node, textNode.offset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch (e) {
      this.setCaretToEnd(element);
    }
  }

  private setCaretToEnd(element: HTMLDivElement): void {
    const range = document.createRange();
    const sel = window.getSelection();
    if (!sel) return;
    range.selectNodeContents(element);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  private getTextNodeAtOffset(
    node: Node,
    offset: number
  ): { node: Node; offset: number } {
    let currentOffset = 0;
    const walk = (n: Node): { node: Node; offset: number } | null => {
      if (n.nodeType === Node.TEXT_NODE) {
        const length = n.textContent?.length || 0;
        if (currentOffset + length >= offset) {
          return { node: n, offset: offset - currentOffset };
        }
        currentOffset += length;
      } else {
        for (const child of Array.from(n.childNodes)) {
          const result = walk(child);
          if (result) return result;
        }
      }
      return null;
    };
    return walk(node) || { node, offset: 0 };
  }

  insertTextAtCursor(
    element: HTMLDivElement | undefined,
    textToInsert: string,
    escapeHtml: (text: string) => string
  ): number {
    if (!element) return 0;
    const cursorPos = this.getCaretPosition(element);
    const currentText = this.getTextContent(element);
    const before = currentText.slice(0, cursorPos);
    const after = currentText.slice(cursorPos);
    const newText = before + textToInsert + after;
    element.innerHTML = escapeHtml(newText);
    const newCursorPos = cursorPos + textToInsert.length;
    this.setCaretPosition(element, newCursorPos);
    return newCursorPos;
  }
}