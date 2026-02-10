import { Injectable } from '@angular/core';
import { ReactionId } from '../../../shared/data/reactions';

@Injectable({ providedIn: 'root' })
export class MessageEmojiStorageService {
  private readonly STORAGE_KEY = 'recentEmojis';
  private readonly DEFAULT_EMOJIS: ReactionId[] = ['check', 'thumbsup'];
  private readonly MAX_RECENT = 2;

  loadRecentEmojis(): ReactionId[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) 
          ? parsed.slice(0, this.MAX_RECENT) 
          : this.DEFAULT_EMOJIS;
      }
    } catch (e) {
      console.error('Error loading recent emojis:', e);
    }
    return this.DEFAULT_EMOJIS;
  }

  saveRecentEmoji(reactionId: ReactionId, currentRecent: ReactionId[]): ReactionId[] {
    const updated = [
      reactionId, 
      ...currentRecent.filter(id => id !== reactionId)
    ].slice(0, this.MAX_RECENT);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent emoji:', e);
    }

    return updated;
  }
}