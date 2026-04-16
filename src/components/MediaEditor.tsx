import { useState, useRef } from 'react';
import { MediaAttachment } from '@/types/note';
import { v4 as uuidv4 } from 'uuid';
import { Music, Video, Pencil, Trash2, Upload, Play, Pause, X, Check, Link } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaEditorProps {
  media: MediaAttachment[];
  onChange: (media: MediaAttachment[]) => void;
}

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

function AudioPlayer({ attachment, onRename, onDelete }: {
  attachment: MediaAttachment;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(attachment.name);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause(); else audioRef.current.play();
    setPlaying(!playing);
  };

  const saveName = () => { onRename(name); setEditing(false); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-2xl glass-card"
    >
      <audio ref={audioRef} src={attachment.url} onEnded={() => setPlaying(false)} />
      <button onClick={togglePlay}
        className="w-10 h-10 rounded-xl glass-primary flex items-center justify-center flex-shrink-0">
        {playing ? <Pause size={16} className="text-primary-foreground" /> : <Play size={16} className="text-primary-foreground ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1">
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
              className="text-sm font-body font-semibold bg-transparent outline-none border-b border-primary/40 w-full" />
            <button onClick={saveName} className="p-1 text-primary"><Check size={14} /></button>
          </div>
        ) : (
          <p className="text-sm font-body font-semibold text-foreground truncate">{attachment.name}</p>
        )}
        <p className="text-[10px] font-body text-muted-foreground">Audio</p>
      </div>
      <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg glass-icon text-muted-foreground"><Pencil size={13} /></button>
      <button onClick={onDelete} className="p-1.5 rounded-lg glass-icon text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
    </motion.div>
  );
}

function YoutubePlayer({ attachment, onRename, onDelete }: {
  attachment: MediaAttachment;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(attachment.name);
  const videoId = extractYoutubeId(attachment.url);
  const saveName = () => { onRename(name); setEditing(false); };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass-card overflow-hidden">
      {videoId && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}`}
            className="absolute inset-0 w-full h-full rounded-t-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      )}
      <div className="p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(145deg, hsl(0 80% 55%), hsl(0 80% 42%))', boxShadow: '0 2px 8px -2px hsl(0 80% 40% / 0.3), 0 -1px 0 0 hsl(0 0% 100% / 0.2) inset' }}>
          <Video size={14} className="text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <input autoFocus value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                className="text-sm font-body font-semibold bg-transparent outline-none border-b border-primary/40 w-full" />
              <button onClick={saveName} className="p-1 text-primary"><Check size={14} /></button>
            </div>
          ) : (
            <p className="text-sm font-body font-semibold text-foreground truncate">{attachment.name}</p>
          )}
        </div>
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg glass-icon text-muted-foreground"><Pencil size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg glass-icon text-muted-foreground hover:text-destructive"><Trash2 size={13} /></button>
      </div>
    </motion.div>
  );
}

export default function MediaEditor({ media, onChange }: MediaEditorProps) {
  const [showYtInput, setShowYtInput] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange([...media, { id: uuidv4(), type: 'audio', name: file.name.replace(/\.[^/.]+$/, ''), url: reader.result as string }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addYoutube = () => {
    if (!extractYoutubeId(ytUrl)) return;
    onChange([...media, { id: uuidv4(), type: 'youtube', name: 'YouTube Video', url: ytUrl }]);
    setYtUrl(''); setShowYtInput(false);
  };

  const rename = (id: string, name: string) => onChange(media.map(m => m.id === id ? { ...m, name } : m));
  const remove = (id: string) => onChange(media.filter(m => m.id !== id));

  return (
    <div className="space-y-3">
      <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
        <span className="w-5 h-5 rounded-md glass-icon flex items-center justify-center">
          <Music size={11} className="text-primary" />
        </span>
        Media
      </h4>

      <div className="space-y-2">
        {media.map(m => m.type === 'audio' ? (
          <AudioPlayer key={m.id} attachment={m} onRename={n => rename(m.id, n)} onDelete={() => remove(m.id)} />
        ) : (
          <YoutubePlayer key={m.id} attachment={m} onRename={n => rename(m.id, n)} onDelete={() => remove(m.id)} />
        ))}
      </div>

      <div className="flex gap-2">
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
        <button onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-semibold glass-btn text-foreground">
          <Upload size={15} /> Audio
        </button>
        <button onClick={() => setShowYtInput(!showYtInput)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-semibold glass-btn text-foreground">
          <Video size={15} /> YouTube
        </button>
      </div>

      <AnimatePresence>
        {showYtInput && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input autoFocus value={ytUrl} onChange={e => setYtUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addYoutube(); }}
                  placeholder="Paste YouTube URL..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-body glass-input outline-none" />
              </div>
              <button onClick={addYoutube} className="p-2.5 rounded-xl glass-primary text-primary-foreground"><Check size={16} /></button>
              <button onClick={() => { setShowYtInput(false); setYtUrl(''); }} className="p-2.5 rounded-xl glass-btn text-muted-foreground"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
