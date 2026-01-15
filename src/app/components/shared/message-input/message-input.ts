import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  OnInit,
  Output,
  EventEmitter,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../models/channel.interface';
import { User } from '../../../models/user.model';
import { AvatarId, getAvatarById } from '../../../../shared/data/avatars';
import { MessageInputService } from '../../../services/message/message-intput.service';
import { UserService } from '../../../services/user.service';
import { NewMessageService } from '../../../services/message/new-message.service';
import { ThreadService } from '../../../services/thread.service';
import { MessageInputMentionService } from '../../../services/message/message-input-mention.service';
import { MessageInputEmojiService } from '../../../services/message/message-input-emoji.service';
import { FormsModule } from '@angular/forms';
import { emojiReactions } from '../../../../shared/data/reactions';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss',
})
export class MessageInput implements OnInit {

  @Input() channel?: Channel;
  @Input() currentUserUid: string | null = null;
  @Input() contextType: 'channel' | 'conversation' | 'thread' = 'channel';
  @Input() conversationId?: string | null;
  @Input() forceEditable = false;
  @Input() placeholderText?: string;

  @Input() set editingMessage(value: { id: string; text: string } | undefined) {
    this._editingMessage = value;
    this.isEditing = !!value;

    if (value && this.messageInput) {
      this.messageInput.nativeElement.innerHTML = this.escapeHtml(value.text);
    }
  }
  get editingMessage() {
    return this._editingMessage;
  }

  @Output() editFinished = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<{
    contextType: 'channel' | 'conversation';
    channelId?: string;
    conversationId?: string;
  }>();
  @Output() threadMessageSent = new EventEmitter<{ text: string }>();

  isEditing = false;

  showEmojiPicker = false;
  emojiReactions = emojiReactions;
  private _editingMessage?: { id: string; text: string };
  private newMessage = inject(NewMessageService);
  private threadService = inject(ThreadService);
  private mentionService = inject(MessageInputMentionService);
  private emojiService = inject(MessageInputEmojiService);

  @ViewChild('messageInput') messageInput?: ElementRef<HTMLDivElement>;
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;

  public userService = inject(UserService);

  constructor(private messageService: MessageInputService) { }

  users: User[] = [];
  filteredUsers: User[] = [];
  channelsList: Channel[] = [];
  filteredChannels: Channel[] = [];

  activeMentionType: 'user' | 'channel' | null = null;
  showMentions = false;
  mentionPosition = { top: 0, left: 0, bottom: 0 };
  selectedMentionIndex = 0; // Für Keyboard-Navigation

  ngOnInit(): void {
    this.messageService.loadUsers().subscribe((users) => {
      this.users = users;
      this.filteredUsers = users;
    });

    this.messageService.loadChannels().subscribe((channels) => {
      this.channelsList = channels;
      this.filteredChannels = channels;
    });
  }

  getAvatarSrc(id: AvatarId) {
    return getAvatarById(id).src;
  }

  // ========== CONTENTEDITABLE HELPER METHODS ==========
  
  private getTextContent(): string {
    const div = this.messageInput?.nativeElement;
    if (!div) return '';
    return div.innerText || '';
  }

  private setCaretPosition(offset: number): void {
    const div = this.messageInput?.nativeElement;
    if (!div) return;

    const range = document.createRange();
    const sel = window.getSelection();
    if (!sel) return;

    try {
      const textNode = this.getTextNodeAtOffset(div, offset);
      if (textNode.node) {
        range.setStart(textNode.node, textNode.offset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch (e) {
      // Fallback: Setze Caret ans Ende
      range.selectNodeContents(div);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  private getTextNodeAtOffset(node: Node, offset: number): { node: Node; offset: number } {
    let currentOffset = 0;
    
    const walk = (n: Node): { node: Node; offset: number } | null => {
      if (n.nodeType === Node.TEXT_NODE) {
        const length = n.textContent?.length || 0;
        if (currentOffset + length >= offset) {
          return { node: n, offset: offset - currentOffset };
        }
        currentOffset += length;
      } else {
        for (const child of Array.from(n.childNodes)) {
          const result = walk(child);
          if (result) return result;
        }
      }
      return null;
    };

    return walk(node) || { node, offset: 0 };
  }

  private getCaretPosition(): number {
    const div = this.messageInput?.nativeElement;
    if (!div) return 0;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;

    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(div);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  }

  onInput(event: Event): void {
    this.validateAndFormatMentions();
  }

  private validateAndFormatMentions(): void {
    const div = this.messageInput?.nativeElement;
    if (!div) return;

    const currentPos = this.getCaretPosition();
    const text = this.getTextContent();
    
    console.log('🔄 validateAndFormatMentions:', { text, currentPos });
    
    // Neuer Ansatz: Suche nach allen @-Mentions und prüfe jeden einzeln
    let newHTML = '';
    let lastIndex = 0;
    let foundMentions = 0;
    
    // Finde alle @ Positionen
    const atPositions: number[] = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '@') {
        atPositions.push(i);
      }
    }
    
    for (const atPos of atPositions) {
      // Extrahiere den Text nach @
      const afterAt = text.slice(atPos + 1);
      
      // Finde das nächste Leerzeichen oder Ende
      const endMatch = afterAt.match(/^([A-Za-zÄÖÜäöüß\s]+)/);
      if (!endMatch) continue;
      
      const potentialName = endMatch[1].trim();
      
      // Prüfe alle möglichen Präfixe (längste zuerst!)
      const words = potentialName.split(/\s+/);
      let matchedName: string | null = null;
      
      // Versuche von längsten Namen zu kürzesten
      for (let wordCount = words.length; wordCount > 0; wordCount--) {
        const testName = words.slice(0, wordCount).join(' ');
        
        const isValid = this.users.some(u => {
          const userName = (u.displayName ?? u.name ?? '').trim();
          return userName.toLowerCase() === testName.toLowerCase();
        });
        
        if (isValid) {
          matchedName = testName;
          break;
        }
      }
      
      if (matchedName) {
        foundMentions++;
        const fullMatch = `@${matchedName}`;
        const matchEnd = atPos + fullMatch.length;
        
        console.log(`  📌 Match ${foundMentions}:`, { fullMatch, name: matchedName, index: atPos });
        console.log(`    ✓ Valid user: true`);
        
        // Füge Text vor dem Match hinzu
        newHTML += this.escapeHtml(text.slice(lastIndex, atPos));
        
        // Füge formatierte Mention hinzu
        newHTML += `<span class="mention-bold">${this.escapeHtml(fullMatch)}</span>`;
        
        lastIndex = matchEnd;
      }
    }
    
    // Füge den Rest hinzu
    newHTML += this.escapeHtml(text.slice(lastIndex));
    
    console.log(`  📊 Found ${foundMentions} mentions, updating HTML`);

    // Aktualisiere nur wenn sich was geändert hat
    if (div.innerHTML !== newHTML) {
      div.innerHTML = newHTML;
      this.setCaretPosition(currentPos);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== END CONTENTEDITABLE HELPERS ==========

  onKeyup(event: KeyboardEvent | Event) {
    // Ignoriere Arrow Keys und Enter in keyup - die werden in keydown behandelt
    if (event instanceof KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) {
        return;
      }
    }

    const div = event.target as HTMLDivElement;
    const value = this.getTextContent();
    const lastChar = value.slice(-1);

    if (lastChar === '@' || lastChar === '#') {
      this.startMention(lastChar);
      return;
    }

    if (!this.showMentions || !this.activeMentionType) return;

    this.updateMentionPosition();
    this.filterMentions(value);
  }

  onKeydown(event: KeyboardEvent) {
    // Wenn Mention-Dropdown offen ist, handle Navigation und Auswahl
    if (this.showMentions && this.activeMentionType) {
      if (this.handleMentionKeyboardNavigation(event)) {
        event.preventDefault();
        event.stopPropagation();
        return; // ← WICHTIG: Verhindere weitere Verarbeitung!
      }
    }

    // ENTER für normale Nachricht senden (nur wenn kein Mention-Dropdown offen)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onEnter(event);
    }
  }

  private handleMentionKeyboardNavigation(event: KeyboardEvent): boolean {
    const items = this.activeMentionType === 'user' ? this.filteredUsers : this.filteredChannels;
    
    if (event.key === 'ArrowDown') {
      this.selectedMentionIndex = Math.min(this.selectedMentionIndex + 1, items.length - 1);
      this.scrollToSelectedMention();
      return true;
    }
    
    if (event.key === 'ArrowUp') {
      this.selectedMentionIndex = Math.max(this.selectedMentionIndex - 1, 0);
      this.scrollToSelectedMention();
      return true;
    }
    
    // ENTER oder TAB zum Auswählen
    if ((event.key === 'Enter' || event.key === 'Tab') && items.length > 0) {
      const selectedItem = items[this.selectedMentionIndex];
      if (this.activeMentionType === 'user') {
        this.onSelectUser(selectedItem as User);
      } else {
        this.onSelectChannel(selectedItem as Channel);
      }
      return true;
    }
    
    if (event.key === 'Escape') {
      this.resetMentions();
      return true;
    }
    
    return false;
  }

  private scrollToSelectedMention() {
    // Warte kurz damit Angular das DOM aktualisiert hat
    setTimeout(() => {
      const dropdown = document.querySelector('.mention-dropdown');
      if (!dropdown) return;
      
      const selectedItem = dropdown.querySelector('.mention-item.selected') as HTMLElement;
      if (!selectedItem) return;
      
      // Scrolle selected Item in sichtbaren Bereich
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 0);
  }

  private startMention(trigger: string) {
    this.showMentions = true;
    this.activeMentionType = trigger === '@' ? 'user' : 'channel';
    this.selectedMentionIndex = 0; // Reset selection

    if (this.activeMentionType === 'user') {
      this.filteredUsers = this.users;
    } else {
      this.filteredChannels = this.channelsList;
    }

    this.updateMentionPosition();
  }

  private filterMentions(value: string) {
    this.selectedMentionIndex = 0; // Reset bei neuem Filter
    if (this.activeMentionType === 'user') {
      this.filterUserMentions(value);
    } else {
      this.filterChannelMentions(value);
    }
  }

  private filterUserMentions(value: string) {
    const result = this.messageService.filterUsersByQuery(this.users, value);
    if (result === null || result.length === 0) {
      this.resetMentions();
      this.filteredUsers = [];
      return;
    }
    this.filteredUsers = result;
  }

  private filterChannelMentions(value: string) {
    const result = this.messageService.filterChannelsByQuery(this.channelsList, value);
    if (result === null || result.length === 0) {
      this.resetMentions();
      this.filteredChannels = [];
      return;
    }
    this.filteredChannels = result;
  }

  private resetMentions() {
    this.showMentions = false;
    this.activeMentionType = null;
  }
  onEnter(event: KeyboardEvent | Event) {
    if ((event as KeyboardEvent).shiftKey) return;

    if (this.isReadOnly) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    this.onSend();
  }

  async onSend() {
    const text = this.getTrimmedText();
    if (!text) return;
    if (this.contextType === 'thread') {
      this.handleThreadSend(text);
      return;
    }
    if (this.isNewMessageFlow()) {
      await this.handleNewMessageFlow(text);
      return;
    }
    await this.handleNormalSend(text);
  }

  private handleThreadSend(text: string) {
    this.threadMessageSent.emit({ text });
    this.afterSend();
  }

  private isNewMessageFlow(): boolean {
    return this.forceEditable &&
           this.contextType === 'conversation' &&
           !this.conversationId &&
           !this.channel;
  }

  private async handleNewMessageFlow(text: string) {
    const ok = await this.newMessage.sendAndNavigate(text);
    if (ok) this.afterSend();
  }

  private async handleNormalSend(text: string) {
    if (!this.currentUserUid) {
      console.warn('Kein aktueller Benutzer (UID).');
      return;
    }

    try {
      const ctx = await this.sendByContext(text, this.currentUserUid);
      this.afterSend();
      this.messageSent.emit(ctx);
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }
  private getTrimmedText(): string {
    const div = this.messageInput?.nativeElement;
    if (!div) return '';  // ← NULL-CHECK!
    return this.getTextContent().trim();
  }

  private async sendByContext(
    text: string,
    senderId: string
  ): Promise<{ contextType: 'channel' | 'conversation'; channelId?: string; conversationId?: string }> {
    if (this.contextType === 'channel') {
      const channelId = await this.handleChannelSend(text, senderId);
      return { contextType: 'channel', channelId };
    } else {
      const conversationId = await this.handleConversationSend(text, senderId);
      return { contextType: 'conversation', conversationId };
    }
  }
  private async handleChannelSend(text: string, senderId: string): Promise<string> {
    if (!this.channel?.id) {
      console.warn('Kein Channel gesetzt.');
      return '';
    }
    const channelId = this.channel.id as string;
    if (this.isEditing && this.editingMessage?.id) {
      await this.messageService.updateChannelMessage(channelId, this.editingMessage.id, text);
    } else {
      await this.messageService.sendChannelMessage(channelId, text, senderId);
    }
    return channelId;
  }
  private async handleConversationSend(text: string, senderId: string): Promise<string> {
    if (!this.conversationId) {
      console.warn('Keine Conversation-ID gesetzt.');
      return '';
    }
    const convId = this.conversationId;
    if (this.isEditing && this.editingMessage?.id) {
      await this.messageService.updateConversationMessage(convId, this.editingMessage.id, text);
    } else {
      await this.messageService.sendConversationMessage(convId, text, senderId);
    }
    return convId;
  }
  private afterSend() {
    const div = this.messageInput?.nativeElement;
    if (div) {  // ← NULL-CHECK!
      div.innerHTML = '';
    }
    this.resetMentions();
    this.isEditing = false;
    this._editingMessage = undefined;
    this.editFinished.emit();
  }
  private updateMentionPosition() {
    const div = this.messageInput?.nativeElement;
    if (!div) return;
    
    const containerEl = this.container.nativeElement;
    
    // Hole die aktuelle Selection
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    
    // Berechne Position relativ zum Container
    this.mentionPosition = {
      left: rect.left - containerRect.left,
      bottom: containerRect.bottom - rect.bottom + 8,
      top: rect.bottom - containerRect.top + 8
    };
  }

  getListLabel(user: User): string {
    return this.mentionService.getListLabel(user, this.currentUserUid);
  }

  getMentionLabel(user: User): string {
    return this.mentionService.getMentionLabel(user);
  }

  onSelectUser(user: User) {
    const div = this.messageInput?.nativeElement;
    if (!div) return;
    
    const text = this.getTextContent();
    const lastAtIndex = text.lastIndexOf('@');
    
    if (lastAtIndex === -1) return;
    
    // Finde das Ende der aktuellen Query (nächstes Leerzeichen oder Ende)
    const afterAt = text.slice(lastAtIndex + 1);
    const spaceIndex = afterAt.search(/\s/);
    const queryEndIndex = spaceIndex === -1 
      ? text.length 
      : lastAtIndex + 1 + spaceIndex;
    
    const before = text.slice(0, lastAtIndex);
    const after = text.slice(queryEndIndex);
    const mentionText = `@${this.getMentionLabel(user)}`;
    
    console.log('🔍 onSelectUser Debug:', {
      userName: this.getMentionLabel(user),
      mentionText,
      before,
      after
    });
    
    // Erstelle formatierten HTML
    const beforeHtml = this.escapeHtml(before);
    const mentionHtml = `<span class="mention-bold">${this.escapeHtml(mentionText)}</span>`;
    const afterHtml = this.escapeHtml(after);
    
    const finalHtml = beforeHtml + mentionHtml + '&nbsp;' + afterHtml;
    
    console.log('📝 Setting HTML:', finalHtml);
    
    div.innerHTML = finalHtml;
    
    // Setze Cursor nach der Mention + Leerzeichen
    const newCaretPos = before.length + mentionText.length + 1;
    this.setCaretPosition(newCaretPos);
    
    this.resetMentions();
  }

  onSelectChannel(channel: Channel) {
    const div = this.messageInput?.nativeElement;
    if (!div) return;
    
    const text = this.getTextContent();
    const lastHashIndex = text.lastIndexOf('#');
    
    if (lastHashIndex === -1) return;
    
    // Finde das Ende der aktuellen Query (nächstes Leerzeichen oder Ende)
    const afterHash = text.slice(lastHashIndex + 1);
    const spaceIndex = afterHash.search(/\s/);
    const queryEndIndex = spaceIndex === -1 
      ? text.length 
      : lastHashIndex + 1 + spaceIndex;
    
    const before = text.slice(0, lastHashIndex);
    const after = text.slice(queryEndIndex);
    const channelText = `#${channel.name ?? ''}`;
    
    // Füge Channel-Text ein (ohne extra Formatierung)
    const beforeHtml = this.escapeHtml(before);
    const channelHtml = this.escapeHtml(channelText);
    const afterHtml = this.escapeHtml(after);
    
    div.innerHTML = beforeHtml + channelHtml + '&nbsp;' + afterHtml;
    
    // Setze Cursor nach dem Channel + Leerzeichen
    const newCaretPos = before.length + channelText.length + 1;
    this.setCaretPosition(newCaretPos);
    
    this.resetMentions();
  }

  get isChannelMember(): boolean {
    if (this.contextType !== 'channel') return true;

    if (this.channel?.id === 'general') return true;
    if (!this.channel || !this.currentUserUid) return false;

    const members = (this.channel.members ?? []) as string[];
    return members.includes(this.currentUserUid);
  }

  get isReadOnly(): boolean {
    if (this.contextType === 'thread') return false;
    if (this.forceEditable) return false;
    return this.contextType === 'channel' && !this.isChannelMember;
  }

  onAtButtonClick() {
    if (this.isReadOnly) return;

    const div = this.messageInput?.nativeElement;
    if (!div) return;

    div.focus();

    const cursorPos = this.getCaretPosition();
    const currentText = this.getTextContent();

    const before = currentText.slice(0, cursorPos);
    const after = currentText.slice(cursorPos);
    
    const newText = before + '@' + after;
    div.innerHTML = this.escapeHtml(newText);

    const newCursorPos = cursorPos + 1;
    this.setCaretPosition(newCursorPos);

    this.startMention('@');
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  onEmojiButtonClick() {
    if (this.isReadOnly) return;
    this.toggleEmojiPicker();
  }

  onEmojiSelect(emoji: string) {
    const div = this.messageInput?.nativeElement;
    if (!div) return;
    
    const cursorPos = this.getCaretPosition();
    const currentText = this.getTextContent();
    
    const before = currentText.slice(0, cursorPos);
    const after = currentText.slice(cursorPos);
    
    const newText = before + emoji + after;
    div.innerHTML = this.escapeHtml(newText);
    
    const newCursorPos = cursorPos + emoji.length;
    this.setCaretPosition(newCursorPos);
    
    this.showEmojiPicker = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showEmojiPicker) return;
    const target = event.target as HTMLElement;
    if (this.emojiService.shouldCloseEmojiPicker(target)) {
      this.showEmojiPicker = false;
    }
  }
}