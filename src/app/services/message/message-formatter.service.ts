import { Injectable } from '@angular/core';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class MessageFormatterService {
  
  toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value?.toDate) return value.toDate();
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') return new Date(value);
    return null;
  }

  isSameDay(dateA: any, dateB: any): boolean {
    const a = this.toDate(dateA);
    const b = this.toDate(dateB);
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  getFormattedDate(date: Date | any): string {
    const msgDate = this.toDate(date);
    if (!msgDate) return '';
    const currentYear = new Date().getFullYear();
    const messageYear = msgDate.getFullYear();
    if (messageYear === currentYear) {
      return this.formatDate(msgDate, 'd. MMMM');
    }
    return this.formatDate(msgDate, 'd. MMMM yyyy');
  }

  getFormattedDateWithWeekday(date: Date | any): string {
    const msgDate = this.toDate(date);
    if (!msgDate) return '';
    const currentYear = new Date().getFullYear();
    const messageYear = msgDate.getFullYear();
    const weekday = msgDate.toLocaleString('de-DE', { weekday: 'long' });
    if (messageYear === currentYear) {
      const dayMonth = this.formatDate(msgDate, 'd. MMMM');
      return `${weekday}, ${dayMonth}`;
    }
    const dayMonthYear = this.formatDate(msgDate, 'd. MMMM yyyy');
    return `${weekday}, ${dayMonthYear}`;
  }

  private formatDate(date: Date, format: string): string {
    const day = date.getDate();
    const month = date.toLocaleString('de-DE', { month: 'long' });
    const year = date.getFullYear();
    return format
      .replace('d', day.toString())
      .replace('MMMM', month)
      .replace('yyyy', year.toString());
  }

  parseMessageText(text: string, users: User[]): string {
    if (!text) return '';
    
    // Regex matched @Name (mehrere Wörter mit Großbuchstaben am Anfang)
    // Matched z.B. "Lucas Hamacher" aber stoppt vor "test" in "@Lucas Hamachertest"
    const mentionRegex = /@\[([^\]]+)\]|@([A-Z][a-zäöüÄÖÜß]*(?:\s+[A-Z][a-zäöüÄÖÜß]*)*)/g;
    
    const result = text.replace(mentionRegex, (match, bracketName, simpleName) => {
      const displayName = bracketName || simpleName;
      const user = this.findUserByDisplayName(displayName, users);
      if (user && user.uid) {
        // Speichere User-ID in CSS-Klasse (Angular entfernt data-* Attribute)
        return `<span class="mention mention-${user.uid}">${match}</span>`;
      }
      return match;
    });
    return result;
  }

  private findUserByDisplayName(displayName: string, users: User[]): User | undefined {
    const trimmedName = displayName.trim().toLowerCase();
    return users.find(user => {
      const userDisplayName = (user.displayName ?? user.name ?? '').toLowerCase();
      return userDisplayName === trimmedName;
    });
  }

  getUserIdFromElement(element: HTMLElement): string | null {
    // Prüfe ob Element eine mention ist
    if (element.classList.contains('mention')) {
      return this.extractUserIdFromClasses(element);
    }
    // Prüfe ob ein Parent eine mention ist
    const mentionParent = element.closest('.mention') as HTMLElement | null;
    if (mentionParent) {
      return this.extractUserIdFromClasses(mentionParent);
    }
    return null;
  }

  private extractUserIdFromClasses(element: HTMLElement): string | null {
    // Suche nach mention-{userId} Klasse
    for (const className of Array.from(element.classList)) {
      if (className.startsWith('mention-')) {
        return className.substring(8); // "mention-" entfernen
      }
    }
    return null;
  }
}