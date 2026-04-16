import { useState } from 'react';
import { Note, NoteColor } from '@/types/note';
import { ArrowLeft, Trash2, MoreVertical } from 'lucide-react';
import ChecklistEditor from './ChecklistEditor';
import MindMapEditor from './MindMapEditor';
import ReminderEditor from './ReminderEditor';
import WidgetPreview from './WidgetPreview';
import ColorPicker from './ColorPicker';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const bgClasses: Record<string, string> = {
  yellow: 'note-card-yellow',
  pink: 'note-card-pink',
  blue: 'note-card-blue',
  green: 'note-card-green',
  purple: 'note-card-purple',
  orange: 'note-card-orange',
  mint: 'note-card-mint',
};

interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  categories?: string[];
}

export default function NoteEditor({ note, onUpdate, onDelete, onBack, categories = [] }: NoteEditorProps) {
  const [showMore, setShowMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'note' | 'checklist' | 'mindmap'>('note');

  const handleAddWidget = () => {
    toast({
      title: "Widget Ready!",
      description: `"${note.title || 'Untitled'}" widget is ready. After converting to a native app, this will appear on your home screen.`,
    });
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className={`min-h-screen ${bgClasses[note.color]}`}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-sm bg-inherit">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-foreground/5 transition-colors">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 rounded-xl hover:bg-foreground/5 transition-colors"
            >
              <MoreVertical size={20} className="text-foreground" />
            </button>
          </div>
        </div>

        {showMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 pb-3 space-y-3 overflow-hidden"
          >
            <ColorPicker selected={note.color} onChange={(color) => onUpdate(note.id, { color })} />
            <div className="flex items-center gap-3">
              <select
                value={note.category}
                onChange={e => onUpdate(note.id, { category: e.target.value })}
                className="text-sm font-body bg-foreground/5 rounded-lg px-3 py-1.5 outline-none appearance-none cursor-pointer"
              >
                <option value="All">No category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => { onDelete(note.id); onBack(); }}
                className="flex items-center gap-1 text-destructive text-sm font-body hover:text-destructive/80"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-2">
          {(['note', 'checklist', 'mindmap'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-body font-semibold transition-colors capitalize ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'}`}
            >
              {tab === 'mindmap' ? 'Mind Map' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 space-y-4">
        <input
          value={note.title}
          onChange={e => onUpdate(note.id, { title: e.target.value })}
          placeholder="Title"
          className="w-full text-2xl font-heading font-bold bg-transparent outline-none placeholder:text-foreground/25"
        />

        {activeTab === 'note' && (
          <textarea
            value={note.content}
            onChange={e => onUpdate(note.id, { content: e.target.value })}
            placeholder="Start writing..."
            className="w-full min-h-[200px] text-base font-body bg-transparent outline-none resize-none placeholder:text-foreground/25 leading-relaxed"
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistEditor
            items={note.checklist}
            onChange={checklist => onUpdate(note.id, { checklist })}
          />
        )}

        {activeTab === 'mindmap' && (
          <MindMapEditor
            nodes={note.mindmap}
            onChange={mindmap => onUpdate(note.id, { mindmap })}
          />
        )}

        <div className="border-t border-foreground/10 pt-4">
          <ReminderEditor
            reminder={note.reminder}
            noteTitle={note.title}
            onChange={reminder => onUpdate(note.id, { reminder })}
          />
        </div>

        <div className="border-t border-foreground/10 pt-4">
          <WidgetPreview note={note} onAddWidget={handleAddWidget} />
        </div>
      </div>
    </motion.div>
  );
}
