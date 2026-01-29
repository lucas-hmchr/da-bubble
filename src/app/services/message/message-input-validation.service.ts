import { Injectable } from '@angular/core';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class MessageInputValidationService {

  validateAndFormatMentions(
    text: string,
    users: User[],
    escapeHtml: (text: string) => string
  ): string {
    const atPositions = this.findAtPositions(text);
    let newHTML = '';
    let lastIndex = 0;
    let foundMentions = 0;

    for (const atPos of atPositions) {
      const matchedName = this.findMatchedName(text, atPos, users);
      if (matchedName) {
        foundMentions++;
        const fullMatch = `@${matchedName}`;
        const matchEnd = atPos + fullMatch.length;
        newHTML += escapeHtml(text.slice(lastIndex, atPos));
        newHTML += `<span class="mention-bold">${escapeHtml(fullMatch)}</span>`;
        lastIndex = matchEnd;
      }
    }

    newHTML += escapeHtml(text.slice(lastIndex));
    return newHTML;
  }

  private findAtPositions(text: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '@') {
        positions.push(i);
      }
    }
    return positions;
  }

  private findMatchedName(
    text: string,
    atPos: number,
    users: User[]
  ): string | null {
    const afterAt = text.slice(atPos + 1);
    const endMatch = afterAt.match(/^([A-Za-zÄÖÜäöüß\s]+)/);
    if (!endMatch) return null;

    const potentialName = endMatch[1].trim();
    const words = potentialName.split(/\s+/);

    for (let wordCount = words.length; wordCount > 0; wordCount--) {
      const testName = words.slice(0, wordCount).join(' ');
      const isValid = this.isValidUserName(testName, users);
      if (isValid) {
        return testName;
      }
    }
    return null;
  }

  private isValidUserName(testName: string, users: User[]): boolean {
    return users.some((u) => {
      const userName = (u.displayName ?? u.name ?? '').trim();
      return userName.toLowerCase() === testName.toLowerCase();
    });
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  createMentionHtml(
    before: string,
    mentionText: string,
    after: string,
    escapeHtml: (text: string) => string
  ): string {
    const beforeHtml = escapeHtml(before);
    const mentionHtml = `<span class="mention-bold">${escapeHtml(
      mentionText
    )}</span>`;
    const afterHtml = escapeHtml(after);
    return beforeHtml + mentionHtml + '&nbsp;' + afterHtml;
  }

  createChannelHtml(
    before: string,
    channelText: string,
    after: string,
    escapeHtml: (text: string) => string
  ): string {
    const beforeHtml = escapeHtml(before);
    const channelHtml = escapeHtml(channelText);
    const afterHtml = escapeHtml(after);
    return beforeHtml + channelHtml + '&nbsp;' + afterHtml;
  }
}