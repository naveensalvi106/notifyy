export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'mint';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface MindMapNode {
  id: string;
  text: string;
  description: string;
  children: MindMapNode[];
  collapsed: boolean;
  color: string;
}

export interface NoteReminder {
  id: string;
  time: string;
  daily: boolean;
  datetime: string;
  enabled: boolean;
}

export interface MediaAttachment {
  id: string;
  type: 'audio' | 'youtube';
  name: string;
  url: string; // data URL for audio, youtube URL for videos
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  checklist: ChecklistItem[];
  mindmap: MindMapNode[];
  media: MediaAttachment[];
  reminder?: NoteReminder;
  pinned: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}
