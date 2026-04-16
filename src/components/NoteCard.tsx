import { Note } from '@/types/note';
import { format } from 'date-fns';
import { Pin, Bell, CheckSquare, GitBranch, Music, Video, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

const colorClasses: Record<string, string> = {
  yellow: 'note-card-yellow',
  pink: 'note-card-pink',
  blue: 'note-card-blue',
  green: 'note-card-green',
  purple: 'note-card-purple',
  orange: 'note-card-orange',
  mint: 'note-card-mint',
};

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onPin: () => void;
  index: number;
  onDragStart?: (e: React.DragEvent, noteId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, noteId: string) => void;
}

export default function NoteCard({ note, onClick, onPin, index, onDragStart, onDragOver, onDrop }: NoteCardProps) {
  const checkedCount = note.checklist.filter(c => c.checked).length;
  const preview = note.content.slice(0, 120);
  const audioCount = (note.media || []).filter(m => m.type === 'audio').length;
  const videoCount = (note.media || []).filter(m => m.type === 'youtube').length;

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', note.id); onDragStart?.(e, note.id); }}
      onDragOver={e => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={e => { e.preventDefault(); onDrop?.(e, note.id); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className={`${colorClasses[note.color]} rounded-2xl p-4 cursor-grab active:cursor-grabbing glass-card transition-all hover:scale-[1.02] relative group`}
        onClick={onClick}
      >
      {/* Drag handle */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none">
        <GripVertical size={14} className="text-foreground/50" />
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onPin(); }}
        className={`absolute top-3 right-3 p-1.5 rounded-xl glass-icon transition-opacity ${note.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
      >
        <Pin size={13} className={note.pinned ? 'text-primary fill-current' : 'text-foreground/50'} />
      </button>

      <p className="text-xs text-foreground/50 font-body mb-1">
        {format(new Date(note.updatedAt), 'dd.MM, h:mma')}
      </p>

      {note.title && (
        <h3 className="font-heading font-bold text-foreground text-base mb-1 line-clamp-1">{note.title}</h3>
      )}

      {preview && (
        <p className="text-sm text-foreground/60 font-body line-clamp-3 mb-2 italic">{preview}</p>
      )}

      {note.checklist.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {note.checklist.slice(0, 3).map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className={`w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center text-[10px] ${item.checked ? 'glass-checkbox-checked text-primary-foreground' : 'glass-icon'}`}>
                {item.checked && '✓'}
              </span>
              <span className={`truncate ${item.checked ? 'line-through text-foreground/35' : 'text-foreground/70'}`}>{item.text}</span>
            </div>
          ))}
          {note.checklist.length > 3 && <p className="text-xs text-foreground/40">+{note.checklist.length - 3} more</p>}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {note.checklist.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-foreground/50 px-2 py-0.5 rounded-lg glass-badge">
            <CheckSquare size={10} /> {checkedCount}/{note.checklist.length}
          </span>
        )}
        {note.mindmap.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-foreground/50 px-2 py-0.5 rounded-lg glass-badge">
            <GitBranch size={10} /> Map
          </span>
        )}
        {audioCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-foreground/50 px-2 py-0.5 rounded-lg glass-badge">
            <Music size={10} /> {audioCount}
          </span>
        )}
        {videoCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-foreground/50 px-2 py-0.5 rounded-lg glass-badge">
            <Video size={10} /> {videoCount}
          </span>
        )}
        {note.reminder?.enabled && (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg glass-primary text-primary-foreground">
            <Bell size={10} />
          </span>
        )}
      </div>
      </motion.div>
    </div>
  );
}
