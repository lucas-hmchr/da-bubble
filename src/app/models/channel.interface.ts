export interface Channel {
  id?: string;
  name: string;
  members: string[];
  createdAt?: any;
  lastMessageAt?: any;
  description?: string;
  creatorId?: string;
  creatorName?: string;  // ← NEU!
}
