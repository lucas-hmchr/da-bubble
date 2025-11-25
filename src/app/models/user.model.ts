export type NewUser = {
  fullName: string;
  email: string;
  password: string;
  selectedAvatarName: string;
};

export interface Avatar {
  id?: string;
  avatarUrl?: string;
  createdAt?: any;
  displayName?: string;
  email?: string;
  status?: string;
  name: string;
}
