import { ChecklistItem } from '@/types/note';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export default function ChecklistEditor({ items, onChange }: ChecklistEditorProps) {
  const [newText, setNewText] = useState('');

  const addItem = () => {
    if (!newText.trim()) return;
    onChange([...items, { id: uuidv4(), text: newText.trim(), checked: false }]);
    setNewText('');
  };

  const toggleItem = (id: string) => {
    onChange(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(i => i.id !== id));
  };

  const updateText = (id: string, text: string) => {
    onChange(items.map(i => i.id === id ? { ...i, text } : i));
  };

  return (
    <div className="space-y-3">
      <h4 className="font-heading font-bold text-sm text-foreground">Checklist</h4>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2.5 group">
            <button
              onClick={() => toggleItem(item.id)}
              className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center text-xs transition-all ${
                item.checked ? 'glass-checkbox-checked text-primary-foreground' : 'glass-icon'
              }`}
            >
              {item.checked && '✓'}
            </button>
            <input
              value={item.text}
              onChange={(e) => updateText(item.id, e.target.value)}
              className={`flex-1 bg-transparent text-sm font-body outline-none ${item.checked ? 'line-through text-foreground/35' : 'text-foreground'}`}
            />
            <button
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover:opacity-60 text-destructive transition-opacity p-1 rounded-lg glass-icon"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl glass-subtle">
        <Plus size={16} className="text-primary" />
        <input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add item..."
          className="flex-1 bg-transparent text-sm font-body outline-none placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  );
}
