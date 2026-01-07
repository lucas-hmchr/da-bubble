import { Component, computed, inject, signal } from '@angular/core';
import { ChannelInfoService } from '../../../services/channel-info.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // ← NEU!
import { ChannelService } from '../../../services/channel.service';  // ← NEU (falls vorhanden)

@Component({
  selector: 'app-channel-info-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],  // ← FormsModule hinzugefügt!
  templateUrl: './channel-info-popup.html',
  styleUrl: './channel-info-popup.scss',
})
export class ChannelInfoPopup {
  channelInfoService = inject(ChannelInfoService);
  // channelService = inject(ChannelService);  // ← Falls du einen ChannelService hast
  
  isOpen = computed(() => this.channelInfoService.isOpen());
  channel = computed(() => this.channelInfoService.channel());

  // ========== EDIT MODE STATE ==========
  isEditingName = signal(false);
  editNameValue = signal('');

  close() {
    this.channelInfoService.close();
    this.isEditingName.set(false);  // Reset edit mode
  }

  // ========== CHANNEL NAME EDIT ==========
  
  /**
   * Startet Edit-Modus für Channel-Name
   */
  editChannelName() {
    const currentName = this.channel()?.name || '';
    this.editNameValue.set(currentName);
    this.isEditingName.set(true);
  }

  /**
   * Speichert neuen Channel-Name
   */
  async saveChannelName() {
    const newName = this.editNameValue().trim();
    const ch = this.channel();
    
    if (!newName || !ch?.id) {
      console.error('Invalid name or channel');
      return;
    }

    // Name hat sich nicht geändert
    if (newName === ch.name) {
      this.isEditingName.set(false);
      return;
    }

    try {
      console.log('💾 Saving new channel name:', newName);
      
      // ========== HIER DEINE FIREBASE UPDATE LOGIK ==========
      // Option 1: Mit ChannelService
      // await this.channelService.updateChannelName(ch.id, newName);
      
      // Option 2: Direkt mit Firestore
      // await this.firestore.updateDocument(`channels/${ch.id}`, { name: newName });
      
      // Temporär: Lokal im Signal updaten (für Testing)
      const updatedChannel = { ...ch, name: newName };
      this.channelInfoService.channel.set(updatedChannel);
      
      this.isEditingName.set(false);
      console.log('✅ Channel name updated');
      
    } catch (error) {
      console.error('❌ Error updating channel name:', error);
      alert('Fehler beim Umbenennen des Channels');
    }
  }

  /**
   * Bricht Edit-Modus ab
   */
  cancelEditName() {
    this.isEditingName.set(false);
    this.editNameValue.set('');
  }

  // ========== DESCRIPTION EDIT (für später) ==========
  editDescription() {
    console.log('Edit Description - TODO');
  }

  leaveChannel() {
    console.log('Leave Channel');
    this.close();
  }
}