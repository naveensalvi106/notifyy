import { useState, useEffect, useCallback } from 'react';
import { Note, NoteColor } from '@/types/note';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'easynotes_data';

const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveNotes = (notes: Note[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { saveNotes(notes); }, [notes]);

  const createNote = useCallback((color: NoteColor = 'yellow') => {
    const now = new Date().toISOString();
    const note: Note = {
      id: uuidv4(),
      title: '',
      content: '',
      color,
      checklist: [],
      mindmap: [],
      pinned: false,
      category: 'All',
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [note, ...prev]);
    return note.id;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, pinned: !n.pinned } : n
    ));
  }, []);

  const filteredNotes = notes
    .filter(n => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return { notes: filteredNotes, allNotes: notes, createNote, updateNote, deleteNote, togglePin, searchQuery, setSearchQuery };
}
