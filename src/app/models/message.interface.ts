export interface MessageData {
  id: string;
  text: string;
  authorId: string;
  timestamp: any; // Firestore Timestamp
}