import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Channel } from '../models/channel.interface';

@Injectable({ providedIn: 'root' })
export class MessageInputService {
  private getTriggerQuery(value: string, trigger: string): string | null {
    const lastIndex = value.lastIndexOf(trigger);
    if (lastIndex === -1) return null;

    const after = value.slice(lastIndex + 1);
    const spaceIndex = after.search(/\s/);

    return spaceIndex === -1 ? after : after.slice(0, spaceIndex);
  }

  filterUsersByQuery(users: User[], value: string): User[] | null {
    const query = this.getTriggerQuery(value, '@');
    if (!query) return null;

    const q = query.toLowerCase();
    return users.filter((u) =>
      (u.displayName ?? u.name ?? '').toLowerCase().includes(q)
    );
  }

  filterChannelsByQuery(
    channels: Channel[],
    value: string
  ): Channel[] | null {
    const query = this.getTriggerQuery(value, '#');
    if (!query) return null;

    const q = query.toLowerCase();
    return channels.filter((c) => (c.name ?? '').toLowerCase().includes(q));
  }
}
