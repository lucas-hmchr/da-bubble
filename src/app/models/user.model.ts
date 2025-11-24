export type NewUser = {
  fullName: string;
  email: string;
  password: string;
  selectedAvatarName: string;
};

export interface Avatar {
    id: number,
    name: string,
}
