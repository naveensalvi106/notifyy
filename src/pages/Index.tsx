import { useState, useEffect } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Note, NoteColor } from '@/types/note';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import { Plus, Search, StickyNote, X, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES_KEY = 'easynotes_categories';
const loadCategories = (): string[] => {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const quickColors: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'mint'];

export default function Index() {
  const { notes, createNote, updateNote, deleteNote, togglePin, searchQuery, setSearchQuery } = useNotes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNewColorPicker, setShowNewColorPicker] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>(loadCategories);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');

  useEffect(() => { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(customCategories)); }, [customCategories]);

  const allCategories = ['All', ...customCategories];

  const addCategory = () => {
    const name = newCatName.trim();
    if (name && !allCategories.includes(name)) {
      setCustomCategories(prev => [...prev, name]);
    }
    setNewCatName('');
    setAddingCategory(false);
  };

  const renameCategory = (idx: number) => {
    const oldName = customCategories[idx];
    const newName = editCatName.trim();
    if (newName && newName !== oldName && !allCategories.includes(newName)) {
      setCustomCategories(prev => prev.map((c, i) => i === idx ? newName : c));
      // Update notes with old category
      notes.forEach(n => { if (n.category === oldName) updateNote(n.id, { category: newName }); });
      if (selectedCategory === oldName) setSelectedCategory(newName);
    }
    setEditingCatIdx(null);
    setEditCatName('');
  };

  const deleteCategory = (idx: number) => {
    const name = customCategories[idx];
    setCustomCategories(prev => prev.filter((_, i) => i !== idx));
    if (selectedCategory === name) setSelectedCategory('All');
    setEditingCatIdx(null);
  };

  const editingNote = notes.find(n => n.id === editingId);
  const filtered = selectedCategory === 'All'
    ? notes
    : notes.filter(n => n.category === selectedCategory);

  const handleNew = (color: NoteColor = 'yellow') => {
    const id = createNote(color);
    setEditingId(id);
    setShowNewColorPicker(false);
  };

  if (editingNote) {
    return (
      <NoteEditor
        note={editingNote}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onBack={() => setEditingId(null)}
        categories={customCategories}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StickyNote size={28} className="text-primary" />
            <h1 className="text-2xl font-heading font-extrabold text-foreground">Easy Notes</h1>
          </div>
          <span className="text-xs font-body text-muted-foreground">{notes.length} notes</span>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border text-sm font-body outline-none focus:ring-2 focus:ring-primary/20 shadow-card transition-shadow"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
          {allCategories.map((cat, i) => {
            const isCustom = i > 0;
            const customIdx = i - 1;
            const isEditing = isCustom && editingCatIdx === customIdx;

            if (isEditing) {
              return (
                <div key={cat} className="flex items-center gap-1 flex-shrink-0">
                  <input
                    autoFocus
                    value={editCatName}
                    onChange={e => setEditCatName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') renameCategory(customIdx); if (e.key === 'Escape') setEditingCatIdx(null); }}
                    className="px-3 py-1.5 rounded-full text-sm font-body font-semibold bg-card border border-primary outline-none w-24"
                  />
                  <button onClick={() => renameCategory(customIdx)} className="p-1 text-primary"><Check size={14} /></button>
                  <button onClick={() => deleteCategory(customIdx)} className="p-1 text-destructive"><X size={14} /></button>
                </div>
              );
            }

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                onDoubleClick={() => {
                  if (isCustom) { setEditingCatIdx(customIdx); setEditCatName(cat); }
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-body font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground/60 hover:bg-muted'}`}
              >
                {cat}
              </button>
            );
          })}

          {/* Add category */}
          {addingCategory ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                autoFocus
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') { setAddingCategory(false); setNewCatName(''); } }}
                placeholder="Name..."
                className="px-3 py-1.5 rounded-full text-sm font-body font-semibold bg-card border border-primary outline-none w-24 placeholder:text-muted-foreground"
              />
              <button onClick={addCategory} className="p-1 text-primary"><Check size={14} /></button>
              <button onClick={() => { setAddingCategory(false); setNewCatName(''); }} className="p-1 text-muted-foreground"><X size={14} /></button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="w-8 h-8 rounded-full bg-card border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors flex-shrink-0"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <StickyNote size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-body">No notes yet</p>
            <p className="text-sm text-muted-foreground/60 font-body">Tap + to create your first note</p>
          </motion.div>
        ) : (
          <div className="columns-2 gap-3 space-y-3">
            {filtered.map((note, i) => (
              <div key={note.id} className="break-inside-avoid">
                <NoteCard note={note} index={i} onClick={() => setEditingId(note.id)} onPin={() => togglePin(note.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewColorPicker && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-5 bg-card rounded-2xl shadow-elevated p-3 flex gap-2 border border-border">
            {quickColors.map(c => (
              <button key={c} onClick={() => handleNew(c)}
                className={`w-9 h-9 rounded-full note-card-${c} border-2 border-transparent hover:border-primary/40 transition-all`} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.9 }}
        onClick={() => showNewColorPicker ? handleNew() : setShowNewColorPicker(true)}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-elevated flex items-center justify-center">
        <Plus size={28} />
      </motion.button>
    </div>
  );
}
