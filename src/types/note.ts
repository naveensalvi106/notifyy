export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'mint';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children: string[];
}

export interface NoteReminder {
  id: string;
  datetime: string; // ISO string
  enabled: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  checklist: ChecklistItem[];
  mindmap: MindMapNode[];
  reminder?: NoteReminder;
  pinned: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}
