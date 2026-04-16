import { Bell, X, Clock, Repeat } from 'lucide-react';
import { NoteReminder } from '@/types/note';
import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';

interface ReminderEditorProps {
  reminder?: NoteReminder;
  noteTitle: string;
  onChange: (r?: NoteReminder) => void;
}

function CircularTimePicker({ hours, minutes, onHoursChange, onMinutesChange }: {
  hours: number; minutes: number;
  onHoursChange: (h: number) => void;
  onMinutesChange: (m: number) => void;
}) {
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const ringRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 85;

  const getAngleFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!ringRef.current) return 0;
    const rect = ringRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  }, [cx, cy]);

  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const angle = getAngleFromEvent(e);
    if (mode === 'hours') {
      let h = Math.round(angle / 30) % 12;
      if (hours >= 12) h += 12;
      if (h === 24) h = 12;
      if (h === 0 && hours >= 12) h = 12;
      onHoursChange(h);
    } else {
      let m = Math.round(angle / 6) % 60;
      onMinutesChange(m);
    }
  }, [mode, hours, getAngleFromEvent, onHoursChange, onMinutesChange]);

  const handleDown = (e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    handleInteraction(e);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragging.current) handleInteraction(e);
  };

  const handleUp = () => {
    if (dragging.current) {
      dragging.current = false;
      if (mode === 'hours') setMode('minutes');
    }
  };

  const isAM = hours < 12;
  const display12 = hours % 12 || 12;

  // Calculate hand angle
  const handAngle = mode === 'hours'
    ? ((hours % 12) * 30) - 90
    : (minutes * 6) - 90;

  const handX = cx + radius * 0.7 * Math.cos(handAngle * Math.PI / 180);
  const handY = cy + radius * 0.7 * Math.sin(handAngle * Math.PI / 180);

  // Generate tick marks
  const ticks = mode === 'hours' ? 12 : 12;
  const tickLabels = mode === 'hours'
    ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Digital display */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMode('hours')}
          className={`text-4xl font-heading font-extrabold transition-colors px-1 rounded-lg ${mode === 'hours' ? 'text-primary' : 'text-foreground/30 hover:text-foreground/50'}`}
        >
          {display12.toString().padStart(2, '0')}
        </button>
        <span className="text-4xl font-heading font-extrabold text-foreground/20">:</span>
        <button
          onClick={() => setMode('minutes')}
          className={`text-4xl font-heading font-extrabold transition-colors px-1 rounded-lg ${mode === 'minutes' ? 'text-primary' : 'text-foreground/30 hover:text-foreground/50'}`}
        >
          {minutes.toString().padStart(2, '0')}
        </button>
        <div className="flex flex-col ml-2 gap-0.5">
          <button
            onClick={() => onHoursChange(hours >= 12 ? hours - 12 : hours)}
            className={`text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-md transition-colors ${isAM ? 'bg-primary text-primary-foreground' : 'text-foreground/30 hover:bg-foreground/5'}`}
          >
            AM
          </button>
          <button
            onClick={() => onHoursChange(hours < 12 ? hours + 12 : hours)}
            className={`text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-md transition-colors ${!isAM ? 'bg-primary text-primary-foreground' : 'text-foreground/30 hover:bg-foreground/5'}`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Circular dial */}
      <svg
        ref={ringRef}
        width={size}
        height={size}
        className="cursor-pointer select-none touch-none"
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        onTouchEnd={handleUp}
      >
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={radius + 8} fill="hsl(var(--muted) / 0.5)" />
        <circle cx={cx} cy={cy} r={radius + 8} fill="none" stroke="hsl(var(--border))" strokeWidth={1} />

        {/* Track arc from 12 o'clock to hand */}
        <circle
          cx={cx} cy={cy} r={radius * 0.7}
          fill="none"
          stroke="hsl(var(--primary) / 0.1)"
          strokeWidth={radius * 0.55}
          strokeDasharray={`${((handAngle + 90) / 360) * 2 * Math.PI * radius * 0.7} ${2 * Math.PI * radius * 0.7}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="round"
        />

        {/* Tick labels */}
        {tickLabels.map((label, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const lx = cx + radius * 0.82 * Math.cos(angle);
          const ly = cy + radius * 0.82 * Math.sin(angle);
          const isActive = mode === 'hours'
            ? (hours % 12) === (label % 12)
            : minutes === label;

          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-body pointer-events-none select-none"
              fontSize={isActive ? 15 : 12}
              fontWeight={isActive ? 800 : 500}
              fill={isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground) / 0.45)'}
            >
              {mode === 'minutes' ? label.toString().padStart(2, '0') : label}
            </text>
          );
        })}

        {/* Hand line */}
        <line
          x1={cx} y1={cy}
          x2={handX} y2={handY}
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={5} fill="hsl(var(--primary))" />

        {/* Hand end dot */}
        <circle
          cx={handX} cy={handY} r={18}
          fill="hsl(var(--primary))"
          fillOpacity={0.15}
        />
        <circle
          cx={handX} cy={handY} r={6}
          fill="hsl(var(--primary))"
        />
      </svg>

      <p className="text-xs font-body text-muted-foreground">
        {mode === 'hours' ? 'Select hour' : 'Select minutes'} · tap or drag
      </p>
    </div>
  );
}

export default function ReminderEditor({ reminder, noteTitle, onChange }: ReminderEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const parseTime = (t?: string) => {
    if (!t) return { h: 8, m: 0 };
    const [h, m] = t.split(':').map(Number);
    return { h: h || 0, m: m || 0 };
  };
  const parsed = parseTime(reminder?.time);
  const [hours, setHours] = useState(parsed.h);
  const [minutes, setMinutes] = useState(parsed.m);
  const [isDaily, setIsDaily] = useState(reminder?.daily || false);

  const formatTime = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const timeStr = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  const saveReminder = () => {
    onChange({ id: reminder?.id || uuidv4(), time: timeStr(hours, minutes), daily: isDaily, enabled: true, datetime: '' });
    setExpanded(false);
  };

  const removeReminder = () => {
    onChange(undefined);
    setExpanded(false);
  };

  // Active reminder badge
  if (reminder?.enabled && !expanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-card cursor-pointer"
        onClick={() => { setHours(parseTime(reminder.time).h); setMinutes(parseTime(reminder.time).m); setIsDaily(reminder.daily); setExpanded(true); }}
      >
        <div className="w-9 h-9 rounded-xl glass-primary flex items-center justify-center flex-shrink-0">
          <Bell size={16} className="text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-bold text-foreground">
            {formatTime(parseTime(reminder.time).h, parseTime(reminder.time).m)}
          </p>
          <p className="text-xs font-body text-muted-foreground">
            {reminder.daily ? 'Repeats daily' : 'One time'}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); removeReminder(); }}
          className="p-1.5 rounded-lg glass-icon text-muted-foreground hover:text-destructive"
        >
          <X size={16} />
        </button>
      </motion.div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl glass-btn group"
      >
        <div className="w-9 h-9 rounded-xl glass-icon flex items-center justify-center">
          <Bell size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm font-body font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          Set reminder
        </span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl glass-strong overflow-hidden"
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h4 className="font-heading font-bold text-foreground">Reminder</h4>
          </div>
          <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg glass-icon text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <CircularTimePicker
          hours={hours}
          minutes={minutes}
          onHoursChange={setHours}
          onMinutesChange={setMinutes}
        />

        <button
          onClick={() => setIsDaily(!isDaily)}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${isDaily ? 'glass-primary' : 'glass-btn'}`}
        >
          <Repeat size={16} className={isDaily ? 'text-primary-foreground' : 'text-muted-foreground'} />
          <span className={`text-sm font-body font-semibold flex-1 text-left ${isDaily ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
            Repeat daily
          </span>
          <div className={`w-10 h-6 rounded-full transition-colors relative ${isDaily ? 'bg-primary-foreground/20' : 'bg-foreground/10'}`}>
            <motion.div
              animate={{ x: isDaily ? 18 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-1 w-4 h-4 rounded-full shadow-sm ${isDaily ? 'bg-primary-foreground' : 'bg-card'}`}
            />
          </div>
        </button>

        <button
          onClick={saveReminder}
          className="w-full py-3 rounded-xl glass-primary text-primary-foreground font-heading font-bold text-sm transition-all"
        >
          Set Reminder
        </button>
      </div>
    </motion.div>
  );
}
