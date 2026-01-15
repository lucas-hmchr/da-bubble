import { Injectable, signal } from '@angular/core';
import { MessageData } from '../../models/message.interface';
import { MessageInputService } from './message-intput.service';

@Injectable({ providedIn: 'root' })
export class MessageEditService {
  private editingMessageId = signal<string | null>(null);
  private editText = signal<string>('');
  private originalEditText = signal<string>('');
  private confirmDiscardOnOutside = true;

  constructor(private messageInputService: MessageInputService) {}

  getEditingMessageId(): string | null {
    return this.editingMessageId();
  }

  getEditText(): string {
    return this.editText();
  }

  setEditText(text: string): void {
    this.editText.set(text);
  }

  isEditing(messageId: string): boolean {
    return this.editingMessageId() === messageId;
  }

  startEdit(msg: MessageData): void {
    if (!msg.id) return;
    this.editingMessageId.set(msg.id);
    this.editText.set(msg.text);
    this.originalEditText.set(msg.text);
  }

  cancelEdit(): void {
    this.editingMessageId.set(null);
    this.editText.set('');
    this.originalEditText.set('');
  }

  canSave(): boolean {
    return this.editText().trim().length > 0;
  }

  isDirty(): boolean {
    const a = (this.editText() ?? '').trim();
    const b = (this.originalEditText() ?? '').trim();
    return a !== b;
  }

  tryDiscardEdit(reason: 'outside-click' | 'context-change'): boolean {
    if (!this.editingMessageId()) return true;
    const dirty = this.isDirty();
    if (!dirty || !this.confirmDiscardOnOutside) {
      this.cancelEdit();
      return true;
    }
    const ok = window.confirm('Änderungen verwerfen?');
    if (ok) this.cancelEdit();
    return ok;
  }

  async saveEdit(
    msg: MessageData,
    contextType: 'channel' | 'conversation' | 'thread',
    contextId: string,
    isThreadContext: boolean,
    threadParentMessageId?: string
  ): Promise<boolean> {
    if (!this.canSave() || !msg.id) return false;
    const text = this.editText().trim();

    try {
      if (isThreadContext && threadParentMessageId) {
        await this.saveThreadEdit(
          msg.id,
          text,
          contextType === 'thread' ? 'channel' : contextType,
          contextId,
          threadParentMessageId
        );
      } else if (contextType === 'channel') {
        await this.messageInputService.updateChannelMessage(contextId, msg.id, text);
      } else if (contextType === 'conversation') {
        await this.messageInputService.updateConversationMessage(contextId, msg.id, text);
      }
      this.cancelEdit();
      return true;
    } catch (err) {
      return false;
    }
  }

  private async saveThreadEdit(
    threadMessageId: string,
    text: string,
    contextType: 'channel' | 'conversation',
    contextId: string,
    parentMessageId: string
  ): Promise<void> {
    await this.messageInputService.updateThreadMessage(
      contextType,
      contextId,
      parentMessageId,
      threadMessageId,
      text
    );
  }
}