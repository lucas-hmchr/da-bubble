export type AvatarId =
    | 'avatar_default'
    | 'avatar_female_1'
    | 'avatar_female_2'
    | 'avatar_male_1'
    | 'avatar_male_2'
    | 'avatar_male_3'
    | 'avatar_male_4';

export interface Avatar {
    id: AvatarId;
    src: string;
}

export const avatars: readonly Avatar[] = [
    { id: 'avatar_default', src: 'images/avatars/avatar_default.svg'},
    { id: 'avatar_female_1', src: 'images/avatars/avatar_female_1.svg'},
    { id: 'avatar_female_2', src: 'images/avatars/avatar_female_2.svg'},
    { id: 'avatar_male_1', src: 'images/avatars/avatar_male_1.svg'},
    { id: 'avatar_male_2', src: 'images/avatars/avatar_male_2.svg'},
    { id: 'avatar_male_3', src: 'images/avatars/avatar_male_3.svg'},
    { id: 'avatar_male_4', src: 'images/avatars/avatar_male_4.svg'},
]

export const defaultAvatarId: AvatarId = 'avatar_default';

export function getAvatarById(id: AvatarId | null | undefined): Avatar {
  return avatars.find(a => a.id === id) ?? avatars.find(a => a.id === defaultAvatarId)!;
}

export function getAvatarSrc(id: AvatarId): String {
  return getAvatarById(id).src;
}