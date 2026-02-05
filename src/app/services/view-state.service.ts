import { Injectable, computed, inject } from '@angular/core';
import { ChatContextService, ChatContextType } from './chat-context.service';
import { ChannelService } from './channel.service';
import { ConversationService } from './conversation.service';

export type ViewSituation = 'channel' | 'dm' | 'newMessage';

@Injectable({ providedIn: 'root' })
export class ViewStateService {
  private ctx = inject(ChatContextService);
  private channels = inject(ChannelService);
  private conversations = inject(ConversationService);

  readonly contextType = this.ctx.contextType;
  readonly channelId = this.ctx.channelId;
  readonly convId = this.ctx.convId;

  readonly channel = computed(() => this.channels.activeChannel());
  readonly channelMessages = computed(() => this.channels.activeChannelMessages());
  readonly channelMembers = computed(() => this.channels.channelMembers());

  readonly dmPartner = computed(() => this.conversations.activeConversationPartner());
  readonly dmMessages = computed(() => this.conversations.activeConversationMessages());

readonly situation = computed<ViewSituation>(() => {
  const channelId = this.ctx.channelId();
  const convId = this.ctx.convId();

  if (channelId && channelId != "general") return 'channel';

  if (convId) return 'dm';

  return 'newMessage';
});

  readonly isChannel = computed(() => this.situation() === 'channel');
  readonly isDm = computed(() => this.situation() === 'dm');
  readonly isNew = computed(() => this.situation() === 'newMessage');
  readonly isDmEmpty = computed(() => this.isDm() && this.dmMessages().length === 0);
}
