import { Component, computed, inject, signal } from '@angular/core';
import { ChannelInfoService } from '../../../services/channel-info.service';
import { ChannelService } from '../../../services/channel.service';
import { AuthService } from '../../../auth/auth.service';
import { ProfilePopupService } from '../../../services/profile-popup.service';
import { UserStoreService } from '../../../services/user-store.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-channel-info-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-info-popup.html',
  styleUrl: './channel-info-popup.scss',
})
export class ChannelInfoPopup {
  channelInfoService = inject(ChannelInfoService);
  channelService = inject(ChannelService);
  authService = inject(AuthService);
  profilePopupService = inject(ProfilePopupService);
  userStore = inject(UserStoreService);  // ← NEU!
  router = inject(Router);
  
  isOpen = computed(() => this.channelInfoService.isOpen());
  channel = computed(() => this.channelInfoService.channel());

  // ========== CREATOR INFO (NEU) ==========
  
  /**
   * Ersteller-ID (members[0] oder creatorId)
   */
  creatorId = computed(() => {
    const ch = this.channel();
    if (!ch) return null;
    
    // creatorId ist entweder explizit gesetzt oder members[0]
    return ch.creatorId || (ch.members?.[0] as string) || null;
  });
  
  /**
   * Ersteller-Name (dynamisch aus UserStoreService)
   */
  creatorName = computed(() => {
    const creatorId = this.creatorId();
    if (!creatorId) return 'Unbekannt';
    
    // Hole User aus UserStoreService
    const creator = this.userStore.getUserByUid(creatorId);
    
    return creator?.displayName || creator?.name || 'Unbekannt';
  });

  // ========== EDIT STATE ==========
  isEditingName = signal(false);
  editNameValue = signal('');
  
  isEditingDescription = signal(false);
  editDescriptionValue = signal('');

  close() {
    this.channelInfoService.close();
    this.isEditingName.set(false);
    this.isEditingDescription.set(false);
    this.editNameValue.set('');
    this.editDescriptionValue.set('');
  }

  // ========== CHANNEL NAME EDIT ==========
  
  editChannelName() {
    const currentName = this.channel()?.name || '';
    this.editNameValue.set(currentName);
    this.isEditingName.set(true);
  }

  async saveChannelName() {
    const newName = this.editNameValue().trim();
    const ch = this.channel();
    
    if (!newName || !ch?.id) {
      console.error('❌ Invalid name or channel');
      return;
    }

    if (newName === ch.name) {
      this.isEditingName.set(false);
      return;
    }

    try {
      console.log('💾 Updating channel name in Firebase...');
      
      await this.channelService.updateChannelName(ch.id, newName);
      
      console.log('✅ Channel name updated successfully!');
      
      const updatedChannel = { ...ch, name: newName };
      this.channelInfoService.channel.set(updatedChannel);
      
      this.isEditingName.set(false);
      
    } catch (error) {
      console.error('❌ Error updating channel name:', error);
      alert('Fehler beim Umbenennen des Channels');
    }
  }

  cancelEditName() {
    this.isEditingName.set(false);
    this.editNameValue.set('');
  }

  // ========== DESCRIPTION EDIT ==========
  
  editDescription() {
    const currentDescription = this.channel()?.description || '';
    this.editDescriptionValue.set(currentDescription);
    this.isEditingDescription.set(true);
  }

  async saveDescription() {
    const newDescription = this.editDescriptionValue().trim();
    const ch = this.channel();
    
    if (!ch?.id) {
      console.error('❌ No channel ID');
      return;
    }

    if (newDescription === ch.description) {
      this.isEditingDescription.set(false);
      return;
    }

    try {
      console.log('💾 Updating channel description in Firebase...');
      
      await this.channelService.updateChannelDescription(ch.id, newDescription);
      
      console.log('✅ Channel description updated successfully!');
      
      const updatedChannel = { ...ch, description: newDescription };
      this.channelInfoService.channel.set(updatedChannel);
      
      this.isEditingDescription.set(false);
      
    } catch (error) {
      console.error('❌ Error updating channel description:', error);
      alert('Fehler beim Aktualisieren der Beschreibung');
    }
  }

  cancelEditDescription() {
    this.isEditingDescription.set(false);
    this.editDescriptionValue.set('');
  }

  // ========== CREATOR PROFILE ==========
  
  /**
   * Öffnet Profil-Popup für den Ersteller
   */
  openCreatorProfile() {
    const creatorId = this.creatorId();
    
    if (!creatorId) {
      console.warn('⚠️ No creator ID available');
      return;
    }

    console.log('👤 Opening creator profile:', creatorId);
    
    this.profilePopupService.open(creatorId);
  }

  // ========== LEAVE CHANNEL ==========
  
  /**
   * Verlässt den Channel
   */
  async leaveChannel() {
    const ch = this.channel();
    const currentUserId = this.authService.uid();
    
    if (!ch?.id || !currentUserId) {
      console.error('❌ Missing channel ID or user ID');
      return;
    }

    const confirmed = confirm(
      `Möchtest du den Channel "${ch.name}" wirklich verlassen?`
    );
    
    if (!confirmed) return;

    try {
      console.log('🚪 Leaving channel:', ch.name);
      
      await this.channelService.leaveChannel(ch.id, currentUserId);
      
      console.log('✅ Channel left successfully');
      
      this.close();
      this.router.navigate(['/']);
      
    } catch (error) {
      console.error('❌ Error leaving channel:', error);
      alert('Fehler beim Verlassen des Channels');
    }
  }
}