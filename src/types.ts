export interface CalendarEvent {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
  category: 'lecture' | 'break' | 'exam' | 'registration' | 'other';
  semester: string;
  groupA?: string; // Kedah, Johor, Kelantan, Terengganu
  groupB?: string; // Selangor, etc.
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ScraperStatus {
  status: 'idle' | 'scraping' | 'success' | 'failed';
  message: string;
  lastUpdated?: string;
  scrapedUrl?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}
