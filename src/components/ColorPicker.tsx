import { NoteColor } from '@/types/note';
import { soundEffects } from '@/lib/sounds';

const colors: { value: NoteColor; label: string; gradient: string }[] = [
  { value: 'yellow', label: 'Yellow', gradient: 'linear-gradient(145deg, hsl(48 95% 87%), hsl(45 85% 72%))' },
  { value: 'pink', label: 'Pink', gradient: 'linear-gradient(145deg, hsl(340 85% 90%), hsl(335 75% 75%))' },
  { value: 'blue', label: 'Blue', gradient: 'linear-gradient(145deg, hsl(210 85% 90%), hsl(215 80% 75%))' },
  { value: 'green', label: 'Green', gradient: 'linear-gradient(145deg, hsl(145 65% 87%), hsl(150 55% 72%))' },
  { value: 'purple', label: 'Purple', gradient: 'linear-gradient(145deg, hsl(270 65% 90%), hsl(265 55% 75%))' },
  { value: 'orange', label: 'Orange', gradient: 'linear-gradient(145deg, hsl(25 95% 87%), hsl(20 85% 72%))' },
  { value: 'mint', label: 'Mint', gradient: 'linear-gradient(145deg, hsl(170 55% 87%), hsl(175 50% 72%))' },
];

interface ColorPickerProps {
  selected: NoteColor;
  onChange: (c: NoteColor) => void;
}

export default function ColorPicker({ selected, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2.5">
      {colors.map(c => (
        <button
          key={c.value}
          onClick={() => {
            soundEffects.play('select');
            onChange(c.value);
          }}
          className={`w-8 h-8 rounded-xl glass-icon transition-all ${
            selected === c.value ? 'scale-110 ring-2 ring-primary/30 ring-offset-1' : 'hover:scale-105'
          }`}
          style={{ background: c.gradient }}
          title={c.label}
        />
      ))}
    </div>
  );
}
