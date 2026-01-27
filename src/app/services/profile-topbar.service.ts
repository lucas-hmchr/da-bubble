import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export interface ProfileSaveResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileHandlerService {
  private auth = inject(AuthService);

  async saveProfileName(newName: string, currentUserId: string | null): Promise<ProfileSaveResult> {
    const validationResult = this.validateProfileName(newName, currentUserId);

    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.message,
      };
    }

    try {
      await this.auth.updateUserName(newName.trim());
      return {
        success: true,
        message: 'Name erfolgreich geändert',
      };
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      return {
        success: false,
        message: 'Fehler beim Speichern des Namens.',
      };
    }
  }

  private validateProfileName(
    name: string,
    userId: string | null,
  ): { isValid: boolean; message: string } {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return {
        isValid: false,
        message: 'Bitte gib einen Namen ein.',
      };
    }

    if (!userId) {
      return {
        isValid: false,
        message: 'Fehler: Benutzer nicht gefunden.',
      };
    }

    return {
      isValid: true,
      message: '',
    };
  }
}