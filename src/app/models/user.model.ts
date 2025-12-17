import { AvatarId } from "../../shared/data/avatars";

export type NewUser = {
  fullName: string;
  email: string;
  password: string;
  avatarId: AvatarId;
};

export interface User {
  id?: string;
  avatarId: AvatarId;
  createdAt?: any;
  displayName?: string;
  email?: string;
  status?: string;
  name: string;
  isOnline?: boolean;
  uid?: string;
  lastActiveAt: any;
}
