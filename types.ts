
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  TEXT_STUDIO = 'TEXT_STUDIO',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  VIDEO_STUDIO = 'VIDEO_STUDIO',
  AUDIO_STUDIO = 'AUDIO_STUDIO',
  LIVE_ASSISTANT = 'LIVE_ASSISTANT',
  ANALYSIS_LAB = 'ANALYSIS_LAB',
  MEDIA_TOOLS = 'MEDIA_TOOLS',
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  STRATEGY_HUB = 'STRATEGY_HUB',
  CALENDAR = 'CALENDAR'
}

export interface Message {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export enum ImageAspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  STANDARD = '4:3',
  WIDE = '21:9'
}

export enum ImageSize {
  ONE_K = '1K',
  TWO_K = '2K',
  FOUR_K = '4K'
}

export enum VideoAspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16'
}

export type Tone = 'Professional' | 'Witty' | 'Urgent' | 'Empathetic' | 'Viral/Edgy';
export type Platform = 'LinkedIn' | 'Instagram' | 'Twitter/X' | 'TikTok' | 'Facebook' | 'YouTube' | 'Email';

export interface CalendarItem {
  id: string;
  date: string;
  platform: Platform;
  contentType: string;
  topic: string;
  content: string; // The actual caption/script
  status: 'Draft' | 'Approved' | 'Published';
  hashtags?: string[];
}
