import { useState, useEffect } from 'react';
import { Note, NoteColor } from '@/types/note';
import { ArrowLeft, Trash2, MoreVertical, FileText, CheckSquare, GitBranch, Image, Pin, GripVertical } from 'lucide-react';
import ChecklistEditor from './ChecklistEditor';
import MindMapEditor from './MindMapEditor';
import ReminderEditor from './ReminderEditor';
import ColorPicker from './ColorPicker';
import MediaEditor from './MediaEditor';
import { motion, Reorder } from 'framer-motion';
import { soundEffects } from '@/lib/sounds';

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

const DEFAULT_ORDER = ['note', 'checklist', 'mindmap', 'media'];

export default function NoteEditor({ note, onUpdate, onDelete, onBack, categories = [], userId }: NoteEditorProps) {
  const [showMore, setShowMore] = useState(false);
  const [sections, setSections] = useState<string[]>(note.sectionOrder || DEFAULT_ORDER);

  useEffect(() => {
    if (note.sectionOrder) {
      setSections(note.sectionOrder);
    } else {
      setSections(DEFAULT_ORDER);
    }
  }, [note.sectionOrder]);

  if (!note) return null;

  const handleReorder = (newOrder: string[]) => {
    setSections(newOrder);
    onUpdate(note.id, { sectionOrder: newOrder });
  };

  const renderSection = (key: string) => {
    switch (key) {
      case 'note':
        return (
          <div className="space-y-3 bg-black/5 p-5 rounded-3xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-1 opacity-50">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-foreground/60" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Note Content</span>
              </div>
              <div className="p-2 -mr-2 cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground transition-colors">
                <GripVertical size={20} />
              </div>
            </div>
            <textarea
              value={note.content || ''}
              onChange={e => onUpdate(note.id, { content: e.target.value })}
              placeholder="Start writing..."
              className="w-full min-h-[160px] text-lg font-body bg-transparent outline-none resize-none placeholder:text-foreground/10 leading-relaxed text-foreground"
            />
          </div>
        );
      case 'checklist':
        return (
          <div className="space-y-3 bg-black/5 p-5 rounded-3xl border border-white/5 shadow-inner">
             <div className="flex items-center justify-between mb-1 opacity-50">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-foreground/60" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Checklist</span>
              </div>
              <div className="p-2 -mr-2 cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground transition-colors">
                <GripVertical size={20} />
              </div>
            </div>
            <ChecklistEditor items={note.checklist || []} onChange={checklist => onUpdate(note.id, { checklist })} />
          </div>
        );
      case 'mindmap':
        return (
          <div className="space-y-3 bg-black/5 p-5 rounded-3xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-1 opacity-50">
              <div className="flex items-center gap-2">
                <GitBranch size={16} className="text-foreground/60" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Mind Map</span>
              </div>
              <div className="p-2 -mr-2 cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground transition-colors">
                <GripVertical size={20} />
              </div>
            </div>
            <MindMapEditor nodes={note.mindmap || []} onChange={mindmap => onUpdate(note.id, { mindmap })} />
          </div>
        );
      case 'media':
        return (
          <div className="space-y-3 bg-black/5 p-5 rounded-3xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-1 opacity-50">
              <div className="flex items-center gap-2">
                <Image size={16} className="text-foreground/60" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">Media Attachments</span>
              </div>
              <div className="p-2 -mr-2 cursor-grab active:cursor-grabbing text-foreground/40 hover:text-foreground transition-colors">
                <GripVertical size={20} />
              </div>
            </div>
            <MediaEditor media={note.media || []} onChange={media => onUpdate(note.id, { media })} userId={userId} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`min-h-screen pb-32 transition-colors duration-500 ${bgClasses[note.color || 'yellow']}`}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-3xl border-b border-white/5" style={{ background: 'hsl(0 0% 100% / 0.08)' }}>
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <button onClick={() => {
            soundEffects.play('swoosh');
            onBack();
          }} className="p-3 -ml-2 rounded-2xl glass-icon hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div className="flex gap-3">
            <button onClick={() => {
              soundEffects.play('chime');
              onUpdate(note.id, { pinned: !note.pinned });
            }} className={`p-3 rounded-2xl glass-icon transition-all ${note.pinned ? 'text-primary scale-110' : 'text-foreground hover:bg-white/10'}`}>
              <Pin size={20} fill={note.pinned ? "currentColor" : "none"} />
            </button>
            <button onClick={() => setShowMore(!showMore)} className={`p-3 rounded-2xl glass-icon transition-all ${showMore ? 'bg-white/10 rotate-90' : 'hover:bg-white/10'}`}>
              <MoreVertical size={20} className="text-foreground" />
            </button>
          </div>
        </div>

        {showMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-4 pb-6 space-y-5 overflow-hidden max-w-4xl mx-auto"
          >
            <div className="p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-foreground/40 text-center">Customize Appearance</p>
              <ColorPicker selected={note.color || 'yellow'} onChange={(color) => onUpdate(note.id, { color })} />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <select
                  value={note.category || 'All'}
                  onChange={e => onUpdate(note.id, { category: e.target.value })}
                  className="w-full text-sm font-body font-black rounded-2xl px-5 py-4 outline-none appearance-none cursor-pointer glass-btn text-foreground pr-10 border border-white/10"
                >
                  <option value="All">Uncategorized</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <MoreVertical size={14} />
                </div>
              </div>
              <button
                onClick={() => { 
                  soundEffects.play('delete');
                  onDelete(note.id); 
                  onBack(); 
                }}
                className="flex items-center gap-2 text-destructive text-sm font-body font-black glass-btn px-6 py-4 rounded-2xl border border-destructive/30 hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-8 space-y-10 max-w-4xl mx-auto">
        <div className="space-y-6">
          <input
            value={note.title || ''}
            onChange={e => onUpdate(note.id, { title: e.target.value })}
            placeholder="Untitled Project"
            className="w-full text-4xl font-heading font-black bg-transparent outline-none placeholder:text-foreground/5 tracking-tighter sm:text-5xl"
          />
          
          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-foreground/5" />
            <ReminderEditor 
               reminder={note.reminder} 
               noteTitle={note.title || ''} 
               onChange={reminder => onUpdate(note.id, { reminder })} 
            />
            <div className="h-px flex-1 bg-foreground/5" />
          </div>
        </div>

        <Reorder.Group axis="y" values={sections} onReorder={handleReorder} className="space-y-8">
          {sections.map(sectionId => (
            <Reorder.Item 
              key={sectionId} 
              value={sectionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative list-none group"
            >
              <div className="transition-transform duration-200 group-active:scale-[0.99]">
                {renderSection(sectionId)}
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    </motion.div>
  );
}
