import { useState, useEffect, useCallback } from 'react';
import { Note, NoteColor } from '@/types/note';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'easynotes_data';
const ORDER_KEY = 'easynotes_order';

const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const loadOrder = (): string[] => {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveNotes = (notes: Note[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

const saveOrder = (order: string[]) => {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
};

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [order, setOrder] = useState<string[]>(loadOrder);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { saveNotes(notes); }, [notes]);
  useEffect(() => { saveOrder(order); }, [order]);

  useEffect(() => {
    setOrder(prev => {
      const noteIds = notes.map(note => note.id);
      const prevValid = prev.filter(id => noteIds.includes(id));
      const missing = noteIds.filter(id => !prevValid.includes(id));
      const next = [...prevValid, ...missing];

      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }

      return next;
    });
  }, [notes]);

  const createNote = useCallback((color: NoteColor = 'yellow') => {
    const now = new Date().toISOString();
    const note: Note = {
      id: uuidv4(),
      title: '',
      content: '',
      color,
      media: [],
      checklist: [],
      mindmap: [],
      pinned: false,
      category: 'All',
      createdAt: now,
      updatedAt: now,
    };
    setNotes(prev => [note, ...prev]);
    setOrder(prev => [note.id, ...prev]);
    return note.id;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    ));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setOrder(prev => prev.filter(oid => oid !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, pinned: !n.pinned } : n
    ));
  }, []);

  const reorderNotes = useCallback((fromId: string, toId: string) => {
    setOrder(prev => {
      const noteIds = notes.map(note => note.id);
      const normalized = [...prev.filter(id => noteIds.includes(id)), ...noteIds.filter(id => !prev.includes(id))];
      const fromIdx = normalized.indexOf(fromId);
      const toIdx = normalized.indexOf(toId);

      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return normalized;

      const next = [...normalized];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, [notes]);

  const filteredNotes = notes
    .filter(n => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aIdx = order.indexOf(a.id);
      const bIdx = order.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return { notes: filteredNotes, allNotes: notes, createNote, updateNote, deleteNote, togglePin, reorderNotes, searchQuery, setSearchQuery };
}
