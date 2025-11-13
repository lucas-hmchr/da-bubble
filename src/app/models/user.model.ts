export type NewUser = {
  fullName: string;
  email: string;
  password: string;
  selectedAvatarId: number;
};

export interface Avatar {
    id: number,
    name: string,
}
