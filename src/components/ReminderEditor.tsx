import { Bell, X } from 'lucide-react';
import { NoteReminder } from '@/types/note';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface ReminderEditorProps {
  reminder?: NoteReminder;
  noteTitle: string;
  onChange: (r?: NoteReminder) => void;
}

export default function ReminderEditor({ reminder, noteTitle, onChange }: ReminderEditorProps) {
  const [showPicker, setShowPicker] = useState(false);

  const setReminder = (datetime: string) => {
    onChange({ id: reminder?.id || uuidv4(), datetime, enabled: true });
    setShowPicker(false);
  };

  const removeReminder = () => {
    onChange(undefined);
    setShowPicker(false);
  };

  if (reminder?.enabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10">
        <Bell size={14} className="text-primary" />
        <span className="text-xs font-body text-foreground flex-1">
          Reminder: {new Date(reminder.datetime).toLocaleString()}
        </span>
        <button onClick={removeReminder} className="text-muted-foreground hover:text-destructive">
          <X size={14} />
        </button>
      </div>
    );
  }

  if (showPicker) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="datetime-local"
          className="flex-1 text-sm rounded-lg border border-border bg-card px-2 py-1.5 font-body outline-none focus:ring-2 focus:ring-primary/30"
          onChange={e => e.target.value && setReminder(e.target.value)}
        />
        <button onClick={() => setShowPicker(false)} className="text-muted-foreground text-sm font-body">Cancel</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPicker(true)}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-body"
    >
      <Bell size={14} /> Add reminder
    </button>
  );
}
