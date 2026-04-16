import { Bell, X, Clock, Repeat, ChevronDown } from 'lucide-react';
import { NoteReminder } from '@/types/note';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

interface ReminderEditorProps {
  reminder?: NoteReminder;
  noteTitle: string;
  onChange: (r?: NoteReminder) => void;
}

const presetTimes = [
  { label: 'Morning', time: '08:00' },
  { label: 'Noon', time: '12:00' },
  { label: 'Evening', time: '18:00' },
  { label: 'Night', time: '21:00' },
];

export default function ReminderEditor({ reminder, noteTitle, onChange }: ReminderEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedTime, setSelectedTime] = useState(reminder?.time || '');
  const [isDaily, setIsDaily] = useState(reminder?.daily || false);

  const saveReminder = (time: string, daily: boolean) => {
    setSelectedTime(time);
    setIsDaily(daily);
    onChange({ id: reminder?.id || uuidv4(), time, daily, enabled: true, datetime: '' });
  };

  const removeReminder = () => {
    onChange(undefined);
    setSelectedTime('');
    setIsDaily(false);
    setExpanded(false);
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Active reminder badge
  if (reminder?.enabled && !expanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/8 border border-primary/15 cursor-pointer"
        onClick={() => setExpanded(true)}
      >
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Bell size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-bold text-foreground">
            {formatTime(reminder.time)}
          </p>
          <p className="text-xs font-body text-muted-foreground">
            {reminder.daily ? 'Repeats daily' : 'One time'}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); removeReminder(); }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X size={16} />
        </button>
      </motion.div>
    );
  }

  // Collapsed state
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
      >
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Bell size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm font-body font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          Set reminder
        </span>
      </button>
    );
  }

  // Expanded picker
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h4 className="font-heading font-bold text-foreground">Reminder</h4>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Time input */}
        <div className="relative">
          <input
            type="time"
            value={selectedTime}
            onChange={e => setSelectedTime(e.target.value)}
            className="w-full text-3xl font-heading font-bold text-center bg-muted/50 rounded-2xl py-4 outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none"
          />
        </div>

        {/* Preset times */}
        <div className="grid grid-cols-4 gap-2">
          {presetTimes.map(p => (
            <button
              key={p.time}
              onClick={() => setSelectedTime(p.time)}
              className={`py-2 px-1 rounded-xl text-center transition-all ${selectedTime === p.time
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-foreground/70 hover:bg-muted'
                }`}
            >
              <span className="text-[10px] font-body font-semibold block">{p.label}</span>
              <span className="text-xs font-body">{formatTime(p.time)}</span>
            </button>
          ))}
        </div>

        {/* Daily toggle */}
        <button
          onClick={() => setIsDaily(!isDaily)}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${isDaily
            ? 'bg-accent/20 border border-accent/30'
            : 'bg-muted/30 border border-transparent hover:bg-muted/50'
            }`}
        >
          <Repeat size={16} className={isDaily ? 'text-accent' : 'text-muted-foreground'} />
          <span className={`text-sm font-body font-semibold flex-1 text-left ${isDaily ? 'text-foreground' : 'text-muted-foreground'}`}>
            Repeat daily
          </span>
          <div className={`w-10 h-6 rounded-full transition-colors relative ${isDaily ? 'bg-accent' : 'bg-muted'}`}>
            <motion.div
              animate={{ x: isDaily ? 18 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm"
            />
          </div>
        </button>

        {/* Save button */}
        <button
          onClick={() => { if (selectedTime) { saveReminder(selectedTime, isDaily); setExpanded(false); } }}
          disabled={!selectedTime}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] shadow-sm"
        >
          Set Reminder
        </button>
      </div>
    </motion.div>
  );
}
