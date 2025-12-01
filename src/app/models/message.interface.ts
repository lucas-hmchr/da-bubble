export interface MessageData {
  id?: string;
  text: string;
  senderId: string;
  createdAt: Date;   // du schreibst gerade new Date()
  editedAt: Date;
  threadCount: number;
  reactions: {
    emojiName: string;
    senderId: string;
  };
}