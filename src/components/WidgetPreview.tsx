import { Note } from '@/types/note';
import { Smartphone, Pin } from 'lucide-react';
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

interface WidgetPreviewProps {
  note: Note;
  onAddWidget: () => void;
}

export default function WidgetPreview({ note, onAddWidget }: WidgetPreviewProps) {
  const checkedCount = note.checklist.filter(c => c.checked).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm text-foreground">Widget Preview</h4>
        <button
          onClick={onAddWidget}
          className="flex items-center gap-1.5 text-xs font-body text-primary hover:text-primary/80 transition-colors"
        >
          <Smartphone size={14} /> Add to home screen
        </button>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${colorClasses[note.color]} rounded-2xl p-3 shadow-card max-w-[200px]`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-heading font-bold text-foreground truncate">
            {note.title || 'Untitled'}
          </span>
          {note.pinned && <Pin size={10} className="text-primary fill-current" />}
        </div>

        {note.checklist.length > 0 ? (
          <div className="space-y-0.5">
            {note.checklist.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center gap-1.5 text-[10px]">
                <span className={`w-2.5 h-2.5 rounded-sm border flex-shrink-0 flex items-center justify-center ${item.checked ? 'bg-primary border-primary text-primary-foreground' : 'border-foreground/30'}`}>
                  {item.checked && <span className="text-[7px]">✓</span>}
                </span>
                <span className={`truncate ${item.checked ? 'line-through text-foreground/40' : 'text-foreground/70'}`}>
                  {item.text}
                </span>
              </div>
            ))}
            {note.checklist.length > 4 && (
              <p className="text-[9px] text-muted-foreground">+{note.checklist.length - 4} more</p>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-foreground/60 italic line-clamp-3">{note.content.slice(0, 80)}</p>
        )}
      </motion.div>
    </div>
  );
}
