// shared/data/reactions.ts

export type ReactionId =
  | 'check'
  | 'thumbsup'
  | 'rocket'
  | 'heart'
  | 'wow'
  | 'sad'
  | 'laugh';

export interface ReactionDef {
  id: ReactionId;
  icon: string;     // SVG-Path ODER Emoji
  isEmoji: boolean; // true = Emoji, false = SVG-Datei
}

export const reactionDefs: readonly ReactionDef[] = [
  { id: 'check',    icon: '/assets/icons/global/check1.svg',    isEmoji: false },
  { id: 'thumbsup', icon: '/assets/icons/global/thumbsup1.svg', isEmoji: false },

  // Emoji-Reactions für die Palette
  { id: 'rocket', icon: '🚀', isEmoji: true },
  { id: 'heart',  icon: '❤️', isEmoji: true },
  { id: 'wow',    icon: '🥹', isEmoji: true },
  { id: 'sad',    icon: '😢', isEmoji: true },
  { id: 'laugh',  icon: '🤣', isEmoji: true },
];

export function getReactionDef(id: ReactionId): ReactionDef {
  return reactionDefs.find((r) => r.id === id) ?? reactionDefs[0];
}

// hilfreiche Subsets
export const emojiReactions = reactionDefs.filter((r) => r.isEmoji);
export const quickReactions = reactionDefs.filter((r) => !r.isEmoji);
