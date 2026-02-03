export interface Channel {
  id?: string;
  name: string;
  members: string[];
  createdAt?: any;
  lastMessageAt: number | null;
  description?: string;
  creatorId?: string;
  creatorName?: string;

  isPrivate: boolean;
  createdBy: string;
  admins?: string[];
}
