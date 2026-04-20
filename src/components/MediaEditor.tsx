import { useState, useRef, useEffect } from 'react';
import { MediaAttachment } from '@/types/note';
import { v4 as uuidv4 } from 'uuid';
import { Music, Video, Pencil, Trash2, Upload, Play, Pause, X, Check, Link, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { saveLocalMedia, getLocalMedia } from '@/lib/db';
import { soundEffects } from '@/lib/sounds';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MediaEditorProps {
  media: MediaAttachment[];
  onChange: (media: MediaAttachment[]) => void;
  userId: string | null;
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
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    
    const loadMedia = async () => {
      setLoading(true);
      try {
        if (attachment.url.startsWith('local-')) {
          const mediaItem = await getLocalMedia(attachment.url);
          if (mediaItem) {
            objectUrl = URL.createObjectURL(mediaItem.blob);
            setAudioUrl(objectUrl);
          }
        } else {
          setAudioUrl(attachment.url);
        }
      } catch (err) {
        console.error('Failed to load media:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMedia();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.url]);

  // Sync src and handle loading
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;
    audio.load();

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => setPlaying(false);
    
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || loading) return;
    
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
      toast.error('Can\'t play audio');
      setPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current && !isNaN(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveName = () => { onRename(name); setEditing(false); };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-[1.5rem] glass-strong border border-white/10"
    >
      <audio ref={audioRef} preload="metadata" />
      
      <div className="flex items-center gap-3">
        <button 
          onClick={togglePlay}
          disabled={loading}
          className="w-10 h-10 rounded-xl glass-primary flex items-center justify-center flex-shrink-0 shadow-lg active:scale-95 transition-all"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin text-primary-foreground" />
          ) : playing ? (
            <Pause size={18} className="text-primary-foreground" />
          ) : (
            <Play size={18} className="text-primary-foreground ml-0.5" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <input 
                autoFocus 
                value={name} 
                onChange={e => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }}
                className="text-xs font-heading font-bold bg-white/5 rounded px-2 py-1 outline-none w-full border border-primary/20" 
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-heading font-bold text-foreground truncate cursor-default">{attachment.name}</p>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }} 
                  className="p-2 text-muted-foreground/40 hover:text-primary transition-colors active:scale-90"
                >
                  <Pencil size={15} />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="p-2 text-destructive hover:scale-110 transition-all active:scale-90"
                    >
                      <Trash2 size={15} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-strong border-white/20 rounded-[2rem] w-[90vw] max-w-sm">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading font-bold text-lg">Remove Audio?</AlertDialogTitle>
                      <AlertDialogDescription className="font-body text-foreground/60">
                        This will permanently remove "{attachment.name}" from your note.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-3 sm:space-x-0 mt-4">
                      <AlertDialogCancel className="flex-1 rounded-2xl glass-btn border-none hover:bg-white/10 transition-colors m-0">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          soundEffects.play('delete');
                          if (audioRef.current) audioRef.current.pause();
                          onDelete();
                          toast.info('Audio removed');
                        }}
                        className="flex-1 rounded-2xl glass-primary bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors m-0"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mt-0.5">
            <p className="text-[9px] font-bold tracking-tight text-muted-foreground/50">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        <input 
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 rounded-full appearance-none bg-white/5 overflow-hidden cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.05) 0%)`
          }}
        />
      </div>
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button 
              className="p-1.5 rounded-lg glass-icon text-destructive hover:scale-110 transition-all active:scale-90"
            >
              <Trash2 size={13} />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-strong border-white/20 rounded-[2rem] w-[90vw] max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-heading font-bold text-lg">Remove Video?</AlertDialogTitle>
              <AlertDialogDescription className="font-body text-foreground/60">
                This will remove the YouTube link from your note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3 sm:space-x-0 mt-4">
              <AlertDialogCancel className="flex-1 rounded-2xl glass-btn border-none hover:bg-white/10 transition-colors m-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  soundEffects.play('delete');
                  onDelete();
                  toast.info('Video removed');
                }}
                className="flex-1 rounded-2xl glass-primary bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors m-0"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

export default function MediaEditor({ media, onChange, userId }: MediaEditorProps) {
  const [showYtInput, setShowYtInput] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (e.g., 500MB limit for local DB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File too large (max 500MB)');
      return;
    }

    setUploading(true);
    try {
      let finalUrl = '';
      
      // Try Supabase Storage first if it's not too big for cloud
      if (userId && file.size < 50 * 1024 * 1024) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);
          finalUrl = publicUrl;
        } else {
          console.warn('Cloud upload failed/skipped, using local DB:', error);
        }
      }

      // Fallback to local IndexedDB (much better than base64 for large files)
      if (!finalUrl) {
        finalUrl = await saveLocalMedia(file, file.name);
      }

      onChange([...media, { 
        id: uuidv4(), 
        type: 'audio', 
        name: file.name.replace(/\.[^/.]+$/, ''), 
        url: finalUrl 
      }]);
      toast.success('Audio saved locally');
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to save audio');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
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
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-semibold glass-btn text-foreground disabled:opacity-50"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Audio
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
