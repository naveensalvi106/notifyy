import { Note } from '@/types/note';
import { format } from 'date-fns';
import { Pin, Bell, CheckSquare, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';

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
}

export default function NoteCard({ note, onClick, onPin, index }: NoteCardProps) {
  const checkedCount = note.checklist.filter(c => c.checked).length;
  const preview = note.content.slice(0, 120);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`${colorClasses[note.color]} rounded-2xl p-4 cursor-pointer shadow-card hover:shadow-elevated transition-shadow relative group`}
      onClick={onClick}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onPin(); }}
        className={`absolute top-3 right-3 p-1 rounded-full transition-opacity ${note.pinned ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-60 text-muted-foreground'}`}
      >
        <Pin size={14} className={note.pinned ? 'fill-current' : ''} />
      </button>

      <p className="text-xs text-muted-foreground font-body mb-1">
        {format(new Date(note.updatedAt), 'dd.MM, h:mma')}
      </p>

      {note.title && (
        <h3 className="font-heading font-bold text-foreground text-base mb-1 line-clamp-1">
          {note.title}
        </h3>
      )}

      {preview && (
        <p className="text-sm text-foreground/70 font-body line-clamp-3 mb-2 italic">
          {preview}
        </p>
      )}

      {note.checklist.length > 0 && (
        <div className="space-y-1 mb-2">
          {note.checklist.slice(0, 3).map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${item.checked ? 'bg-primary border-primary text-primary-foreground' : 'border-foreground/30'}`}>
                {item.checked && '✓'}
              </span>
              <span className={`truncate ${item.checked ? 'line-through text-foreground/40' : 'text-foreground/70'}`}>
                {item.text}
              </span>
            </div>
          ))}
          {note.checklist.length > 3 && (
            <p className="text-xs text-muted-foreground">+{note.checklist.length - 3} more</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        {note.checklist.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckSquare size={12} /> {checkedCount}/{note.checklist.length}
          </span>
        )}
        {note.mindmap.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <GitBranch size={12} /> Mindmap
          </span>
        )}
        {note.reminder?.enabled && (
          <span className="flex items-center gap-1 text-xs text-primary">
            <Bell size={12} />
          </span>
        )}
      </div>
    </motion.div>
  );
}
