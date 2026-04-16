import { useState, useEffect } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Note, NoteColor } from '@/types/note';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import { Plus, Search, StickyNote, X, Check } from 'lucide-react';
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
  const filtered = selectedCategory === 'All' ? notes : notes.filter(n => n.category === selectedCategory);

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
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bevel-icon flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, hsl(210 85% 60%), hsl(270 65% 55%))' }}>
              <StickyNote size={18} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-extrabold gradient-text">Easy Notes</h1>
          </div>
          <span className="text-xs font-body text-muted-foreground px-2.5 py-1 rounded-lg bevel-icon">{notes.length} notes</span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card text-sm font-body outline-none focus:ring-2 focus:ring-primary/20 bevel-search transition-shadow"
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
                    className="px-3 py-2 rounded-xl text-sm font-body font-semibold bg-card border-2 border-primary outline-none w-24"
                  />
                  <button onClick={() => renameCategory(customIdx)} className="p-1.5 rounded-lg bevel-btn bg-primary text-primary-foreground"><Check size={13} /></button>
                  <button onClick={() => deleteCategory(customIdx)} className="p-1.5 rounded-lg bevel-btn text-destructive" style={{ background: 'linear-gradient(145deg, hsl(0 72% 95%), hsl(0 72% 90%))' }}><X size={13} /></button>
                </div>
              );
            }

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                onDoubleClick={() => { if (isCustom) { setEditingCatIdx(customIdx); setEditCatName(cat); } }}
                className={`px-4 py-2 rounded-xl text-sm font-body font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bevel-tab-active text-primary-foreground'
                    : 'bevel-tab text-foreground/60'
                }`}
                style={selectedCategory !== cat ? { background: 'linear-gradient(145deg, hsl(0 0% 100% / 0.8), hsl(40 20% 94%))' } : {}}
              >
                {cat}
              </button>
            );
          })}

          {addingCategory ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                autoFocus
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') { setAddingCategory(false); setNewCatName(''); } }}
                placeholder="Name..."
                className="px-3 py-2 rounded-xl text-sm font-body font-semibold bg-card border-2 border-primary outline-none w-24 placeholder:text-muted-foreground"
              />
              <button onClick={addCategory} className="p-1.5 rounded-lg bevel-btn bg-primary text-primary-foreground"><Check size={13} /></button>
              <button onClick={() => { setAddingCategory(false); setNewCatName(''); }} className="p-1.5 text-muted-foreground"><X size={13} /></button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCategory(true)}
              className="w-9 h-9 rounded-xl bevel-btn flex items-center justify-center text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, hsl(0 0% 100% / 0.8), hsl(40 20% 94%))' }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bevel-icon mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, hsl(40 20% 96%), hsl(40 20% 90%))' }}>
              <StickyNote size={28} className="text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-heading font-bold">No notes yet</p>
            <p className="text-sm text-muted-foreground/60 font-body mt-1">Tap + to create your first note</p>
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

      {/* Color picker FAB */}
      <AnimatePresence>
        {showNewColorPicker && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-5 rounded-2xl bevel-card bg-card p-3 flex gap-2">
            {quickColors.map(c => (
              <button key={c} onClick={() => handleNew(c)}
                className={`w-10 h-10 rounded-xl note-card-${c} bevel-btn transition-all`} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.92 }}
        onClick={() => showNewColorPicker ? handleNew() : setShowNewColorPicker(true)}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-2xl bevel-fab text-primary-foreground flex items-center justify-center">
        <Plus size={28} />
      </motion.button>
    </div>
  );
}
