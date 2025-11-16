export interface MessageData {
  id: string;
  text: string;
  senderId: string;
  createdAt: any; // Firestore Timestamp
  editedAt?: any;
  reactions?: { [key: string]: string[] };
  threadCount?: number;
}