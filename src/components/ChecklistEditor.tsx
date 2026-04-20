import { ChecklistItem, NoteReminder } from '@/types/note';
import { Plus, X, Bell, AlignLeft, Check } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { soundEffects } from '@/lib/sounds';
import ReminderEditor from './ReminderEditor';
import { motion, AnimatePresence } from 'framer-motion';

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export default function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const [newText, setNewText] = useState('');
  const [activeReminderId, setActiveReminderId] = useState<string | null>(null);
  const safeItems = items || [];

  const addItem = () => {
    if (!newText.trim()) return;
    soundEffects.play('pop');
    onChange([...safeItems, { id: uuidv4(), text: newText.trim(), checked: false, description: '' }]);
    setNewText('');
  };

  const toggleItem = (id: string) => {
    soundEffects.play('tap');
    onChange(safeItems.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const removeItem = (id: string) => {
    soundEffects.play('delete');
    onChange(safeItems.filter(i => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    onChange(safeItems.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm text-foreground">Checklist</h4>
      </div>
      
      <div className="space-y-3">
        {safeItems.map(item => (
          <div key={item.id} className="group glass-subtle p-3 rounded-2xl transition-all hover:glass-card">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleItem(item.id)}
                className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-xs transition-all ${
                  item.checked ? 'glass-checkbox-checked text-primary-foreground' : 'glass-icon'
                }`}
              >
                {item.checked && '✓'}
              </button>
              
              <div className="flex-1 min-w-0">
                <input
                  value={item.text}
                  onChange={(e) => updateItem(item.id, { text: e.target.value })}
                  className={`w-full bg-transparent text-sm font-body font-bold outline-none ${item.checked ? 'line-through text-foreground/35' : 'text-foreground'}`}
                  placeholder="Task name"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    soundEffects.play('tap');
                    setActiveReminderId(activeReminderId === item.id ? null : item.id);
                  }}
                  className={`p-2 rounded-xl glass-icon transition-colors ${item.reminder?.enabled ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                >
                  <Bell size={14} fill={item.reminder?.enabled ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl glass-icon text-destructive transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="mt-2 pl-9 pr-2">
              <div className="flex items-center gap-2 text-muted-foreground/30 focus-within:text-foreground/40 transition-colors">
                <AlignLeft size={12} className="flex-shrink-0" />
                <input
                  value={item.description || ''}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                  placeholder="Add description (shows in notification)..."
                  className="w-full bg-transparent text-[11px] font-body outline-none placeholder:text-muted-foreground/20"
                />
              </div>
            </div>

            <AnimatePresence>
              {activeReminderId === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="pt-2 border-t border-white/5">
                    <ReminderEditor 
                      reminder={item.reminder} 
                      noteTitle={item.text || 'Task'} 
                      onChange={(r) => {
                        updateItem(item.id, { reminder: r });
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {item.reminder?.enabled && activeReminderId !== item.id && (
              <div className="mt-2 ml-9 flex items-center gap-1.5">
                <div className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center gap-1">
                  <Bell size={10} />
                  {item.reminder.time} {item.reminder.daily && '· Daily'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl glass-subtle border border-white/5 group focus-within:glass-card transition-all">
        <Plus size={18} className="text-primary" />
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="New checklist item..."
          className="flex-1 bg-transparent text-sm font-body font-bold outline-none placeholder:text-muted-foreground/30"
        />
        <button 
          onClick={addItem}
          disabled={!newText.trim()}
          className="p-1.5 rounded-lg glass-primary text-primary-foreground disabled:opacity-0 transition-opacity"
        >
          <Check size={14} />
        </button>
      </div>
    </div>
  );
}
