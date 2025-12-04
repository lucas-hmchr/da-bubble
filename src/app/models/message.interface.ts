import type { ReactionId } from '../../shared/data/reactions';


export interface MessageData {
  id?: string;
  text: string;
  senderId: string;
  createdAt: Date;
  editedAt: Date;
  threadCount: number;
  reactions?: { [key in ReactionId]?: string[] };
  lastReplyAt?: any;
}