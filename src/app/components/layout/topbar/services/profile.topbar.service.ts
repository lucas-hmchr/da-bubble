import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../../auth/auth.service';

export interface ProfileSaveResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileHandlerService {
  private auth = inject(AuthService);

/**
 * Saves a new profile name to the database.
 * @param newName The new name to be saved.
 * @param currentUserId The ID of the user who is saving the name. If null, the current user will be used.
 * @returns A Promise resolving to a ProfileSaveResult object, containing a success flag and a message.
 */
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

/**
 * Validates a given profile name.
 * @param name The name to be validated.
 * @param userId The ID of the user who is trying to save the name. If null, the current user will be used.
 * @returns An object containing a success flag and a message.
 * The success flag will be false if the name is invalid (e.g. empty or whitespace only).
 * The message will contain a human-readable error message explaining why the name is invalid.
 */
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