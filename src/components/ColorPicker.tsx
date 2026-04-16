import { NoteColor } from '@/types/note';

const colors: { value: NoteColor; label: string }[] = [
  { value: 'yellow', label: 'Yellow' },
  { value: 'pink', label: 'Pink' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'mint', label: 'Mint' },
];

const dotColors: Record<string, string> = {
  yellow: 'bg-note-yellow border-yellow-400',
  pink: 'bg-note-pink border-pink-400',
  blue: 'bg-note-blue border-blue-400',
  green: 'bg-note-green border-green-400',
  purple: 'bg-note-purple border-purple-400',
  orange: 'bg-note-orange border-orange-400',
  mint: 'bg-note-mint border-teal-400',
};

interface ColorPickerProps {
  selected: NoteColor;
  onChange: (c: NoteColor) => void;
}

export default function ColorPicker({ selected, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {colors.map(c => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${dotColors[c.value]} ${selected === c.value ? 'scale-125 border-foreground/40' : 'border-transparent'}`}
          title={c.label}
        />
      ))}
    </div>
  );
}
