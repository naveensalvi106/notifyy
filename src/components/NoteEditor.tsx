import { useState } from 'react';
import { Note, NoteColor } from '@/types/note';
import { ArrowLeft, Trash2, MoreVertical, FileText, CheckSquare, GitBranch, Image, Pin } from 'lucide-react';
import ChecklistEditor from './ChecklistEditor';
import MindMapEditor from './MindMapEditor';
import ReminderEditor from './ReminderEditor';
import WidgetPreview from './WidgetPreview';
import ColorPicker from './ColorPicker';
import MediaEditor from './MediaEditor';
import { motion } from 'framer-motion';
import { soundEffects } from '@/lib/sounds';
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
  userId: string | null;
}

const tabs = [
  { key: 'note' as const, label: 'Note', icon: FileText },
  { key: 'checklist' as const, label: 'Checklist', icon: CheckSquare },
  { key: 'mindmap' as const, label: 'Mind Map', icon: GitBranch },
  { key: 'media' as const, label: 'Media', icon: Image },
];

export default function NoteEditor({ note, onUpdate, onDelete, onBack, categories = [], userId }: NoteEditorProps) {
  const [showMore, setShowMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'note' | 'checklist' | 'mindmap' | 'media'>('note');

  const handleAddWidget = () => {
    toast({
      title: "Widget Ready!",
      description: `"${note.title || 'Untitled'}" widget is ready for your home screen.`,
    });
  };

  if (!note) return null;

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`min-h-screen ${bgClasses[note.color || 'yellow']}`}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'hsl(0 0% 100% / 0.15)' }}>
        <div className="flex items-center justify-between p-4">
          <button onClick={() => {
            soundEffects.play('swoosh');
            onBack();
          }} className="p-2.5 -ml-2 rounded-xl glass-icon">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => {
              soundEffects.play('chime');
              onUpdate(note.id, { pinned: !note.pinned });
            }} className={`p-2.5 rounded-xl glass-icon ${note.pinned ? 'text-primary' : 'text-foreground'}`}>
              <Pin size={18} fill={note.pinned ? "currentColor" : "none"} />
            </button>
            <button onClick={() => setShowMore(!showMore)} className="p-2.5 rounded-xl glass-icon">
              <MoreVertical size={18} className="text-foreground" />
            </button>
          </div>
        </div>

        {showMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 pb-3 space-y-3 overflow-hidden"
          >
            <ColorPicker selected={note.color || 'yellow'} onChange={(color) => onUpdate(note.id, { color })} />
            <div className="flex items-center gap-3">
              <select
                value={note.category || 'All'}
                onChange={e => onUpdate(note.id, { category: e.target.value })}
                className="text-sm font-body rounded-xl px-3 py-2 outline-none appearance-none cursor-pointer glass-btn"
              >
                <option value="All">No category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => { 
                  soundEffects.play('delete');
                  onDelete(note.id); 
                  onBack(); 
                }}
                className="flex items-center gap-1.5 text-destructive text-sm font-body font-semibold glass-btn px-3 py-2 rounded-xl"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  soundEffects.play('tap');
                  setActiveTab(tab.key);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-bold whitespace-nowrap transition-all ${
                  isActive ? 'glass-tab-active text-primary-foreground' : 'glass-btn text-foreground/55'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 space-y-4">
        <input
          value={note.title || ''}
          onChange={e => onUpdate(note.id, { title: e.target.value })}
          placeholder="Title"
          className="w-full text-2xl font-heading font-bold bg-transparent outline-none placeholder:text-foreground/20"
        />

        {activeTab === 'note' && (
          <textarea
            value={note.content || ''}
            onChange={e => onUpdate(note.id, { content: e.target.value })}
            placeholder="Start writing..."
            className="w-full min-h-[200px] text-base font-body bg-transparent outline-none resize-none placeholder:text-foreground/20 leading-relaxed"
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistEditor items={note.checklist || []} onChange={checklist => onUpdate(note.id, { checklist })} />
        )}

        {activeTab === 'mindmap' && (
          <MindMapEditor nodes={note.mindmap || []} onChange={mindmap => onUpdate(note.id, { mindmap })} />
        )}

        {activeTab === 'media' && (
          <MediaEditor media={note.media || []} onChange={media => onUpdate(note.id, { media })} userId={userId} />
        )}

        <div className="border-t border-foreground/8 pt-4">
          <ReminderEditor reminder={note.reminder} noteTitle={note.title || ''} onChange={reminder => onUpdate(note.id, { reminder })} />
        </div>

        <div className="border-t border-foreground/8 pt-4">
          <WidgetPreview note={note} onAddWidget={handleAddWidget} />
        </div>
      </div>
    </motion.div>
  );
}
