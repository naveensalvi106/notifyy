import { useState, useEffect, useRef } from 'react';
import { AIChat } from '@/components/AIChat';
import { useNotes } from '@/hooks/useNotes';
import { Note, NoteColor } from '@/types/note';
import NoteCard from '@/components/NoteCard';
import NoteEditor from '@/components/NoteEditor';
import { Plus, Search, X, Check, LogOut, User, RefreshCw, Database, Download, Upload, CloudDownload, Globe, Hash, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import notifyLogo from '@/assets/notify-logo.jpeg';
import { soundEffects } from '@/lib/sounds';
import { toast } from 'sonner';
import { Share } from '@capacitor/share';
import { scheduleNotification } from '@/lib/native';

const quickColors: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'mint'];

interface IndexProps {
  userName: string;
  userEmail?: string;
  onLogout: () => void;
  userId: string | null;
}

export default function Index({ userName, userEmail, onLogout, userId }: IndexProps) {
  const { 
    notes, 
    createNote, 
    updateNote, 
    deleteNote, 
    togglePin, 
    reorderNotes, 
    searchQuery, 
    setSearchQuery, 
    loading, 
    forceSync,
    syncStatus,
    exportNotes,
    importNotes,
    categories: customCategories,
    updateCategories
  } = useNotes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNewColorPicker, setShowNewColorPicker] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [syncToken, setSyncToken] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatIdx, setEditingCatIdx] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isExportingAI, setIsExportingAI] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const allCategories = ['All', ...(customCategories || [])];

  const addCategory = () => {
    const name = newCatName.trim();
    if (name && !allCategories.includes(name)) {
      updateCategories([...(customCategories || []), name]);
    }
    setNewCatName(''); setAddingCategory(false);
  };

  const renameCategory = (idx: number) => {
    const oldName = customCategories[idx];
    const newName = editCatName.trim();
    if (newName && newName !== oldName && !allCategories.includes(newName)) {
      const next = customCategories.map((c, i) => i === idx ? newName : c);
      updateCategories(next);
      notes.forEach(n => { if (n.category === oldName) updateNote(n.id, { category: newName }); });
      if (selectedCategory === oldName) setSelectedCategory(newName);
    }
    setEditingCatIdx(null); setEditCatName('');
  };

  const deleteCategory = (idx: number) => {
    const name = customCategories[idx];
    const next = customCategories.filter((_, i) => i !== idx);
    updateCategories(next);
    if (selectedCategory === name) setSelectedCategory('All');
    setEditingCatIdx(null);
  };

  const editingNote = notes.find(n => n.id === editingId);
  const filtered = selectedCategory === 'All' ? notes : notes.filter(n => n.category === selectedCategory);

  const handleNew = async (color: NoteColor = 'yellow') => {
    soundEffects.play('pop');
    const id = await createNote(color, selectedCategory);
    setShowNewColorPicker(false);
    
    // Use a small delay to ensure the notes list has updated before opening
    setTimeout(() => {
      setEditingId(id);
    }, 150);
  };

  const handleDragStart = (_e: React.DragEvent, noteId: string) => {
    setDragId(noteId);
  };

  const handleDragOver = (_e: React.DragEvent, noteId?: string) => {
    if (noteId && noteId !== dragId) setDragOverId(noteId);
  };

  const handleDrop = (_e: React.DragEvent, targetId: string) => {
    if (dragId && dragId !== targetId) reorderNotes(dragId, targetId);
    setDragId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  const generateAIMemory = () => {
    const header = `--- NOTIFY AI MEMORY CAPSULE ---\nGenerated: ${new Date().toLocaleString()}\nOwner: ${userName}\nDescription: This file contains my structured personal notes and context for AI analysis.\n--------------------------------\n\n`;
    
    const content = notes.map(note => {
      let noteTxt = `## ${note.title || 'Untitled Note'}\n`;
      if (note.category) noteTxt += `📂 Category: ${note.category}\n`;
      noteTxt += `📅 Updated: ${new Date(note.updatedAt).toLocaleDateString()}\n\n`;
      
      if (note.content) {
        noteTxt += `### Content\n${note.content}\n\n`;
      }
      
      if (note.checklist && note.checklist.length > 0) {
        noteTxt += `### Checklist Tasks\n`;
        note.checklist.forEach(item => {
          noteTxt += `${item.checked ? '✅' : '⭕'} ${item.text}${item.description ? ` (${item.description})` : ''}\n`;
        });
        noteTxt += `\n`;
      }
      
      if (note.mindmap && note.mindmap.length > 0) {
        noteTxt += `### Structured Ideas (Mindmap)\n`;
        const flattenNodes = (nodes: any[], depth = 0) => {
          nodes.forEach(node => {
            noteTxt += `${'  '.repeat(depth)}‣ ${node.text}${node.description ? `: ${node.description}` : ''}\n`;
            if (node.children?.length > 0) flattenNodes(node.children, depth + 1);
          });
        };
        flattenNodes(note.mindmap);
        noteTxt += `\n`;
      }
      return noteTxt;
    }).join('\n---\n\n');
    
    return header + content;
  };

  const handleAIMemoryExport = async () => {
    setIsExportingAI(true);
    soundEffects.play('chime');
    try {
      const memory = generateAIMemory();
      
      // 1. Copy to clipboard
      await navigator.clipboard.writeText(memory);
      
      // 2. Download file
      const blob = new Blob([memory], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Notify_Brain_Dump.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("AI Brain Copied & Downloaded!", {
        description: "Paste it in ChatGPT or upload the .md file."
      });
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setIsExportingAI(false);
    }
  };

  if (loading && notes.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 rounded-3xl glass-card animate-pulse overflow-hidden flex items-center justify-center">
          <img src={notifyLogo} alt="Notify" className="w-8 h-8 object-cover opacity-50" />
        </div>
      </div>
    );
  }

  if (editingId && editingNote) {
    return (
      <NoteEditor
        note={editingNote}
        onUpdate={updateNote}
        onDelete={deleteNote}
        onBack={() => {
          soundEffects.play('swoosh');
          setEditingId(null);
        }}
        categories={customCategories}
        userId={userId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-[max(env(safe-area-inset-top,0px),0.5rem)]">
      {showUserInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div onClick={() => {
            soundEffects.play('swoosh');
            setShowUserInfo(false);
          }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="w-full max-w-xs glass-strong p-6 rounded-[2.5rem] relative z-10 border border-white/20 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 shadow-xl border-2 border-primary/20">
                <img src={notifyLogo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-heading font-bold gradient-text">{userName}</h2>
              <p className="text-sm text-muted-foreground font-body break-all">{userEmail}</p>
              <div className="mt-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">v1.3.1 (Sync-Final)</span>
              </div>
              
              <div className="w-full bg-black/20 rounded-xl p-2 mt-4 text-[9px] font-mono text-zinc-500 border border-white/5 break-all">
                <p className="uppercase opacity-50 mb-1 font-bold">Server Connection</p>
                <p>{import.meta.env.VITE_SUPABASE_URL || 'Not Configured'}</p>
              </div>
              
              <div className="w-full h-px bg-white/10 my-4" />
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">Backup & Restore</p>
              
              <div className="grid grid-cols-2 gap-3 w-full mb-3">
                <button 
                  onClick={async () => {
                    soundEffects.play('tap');
                    const data = exportNotes();
                    
                    // 1. Try Electron Native Save
                    if (window.electron?.saveFile) {
                      try {
                        const saved = await window.electron.saveFile({
                          content: data,
                          defaultPath: `notify_backup_${new Date().toISOString().split('T')[0]}.json`
                        });
                        if (saved) {
                          toast.success("Backup saved successfully!");
                        }
                        return;
                      } catch (err) {
                        console.error('Electron save failed:', err);
                      }
                    }

                    // 2. Try Mobile Native Share
                    try {
                      const canShare = await Share.canShare();
                      if (canShare.value) {
                        await Share.share({
                          title: 'Notify Backup',
                          text: data,
                          dialogTitle: 'Save Backup Content',
                        });
                        toast.success("Ready to share!");
                        return;
                      }
                    } catch (err) {
                      console.warn('Native share failed, falling back to browser download', err);
                    }

                    // 3. Desktop/Web Fallback
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `notify_backup_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    toast.success("Backup saved to Downloads!");
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-badge hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                >
                  <Download size={24} className="text-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Export File</span>
                </button>

                <button 
                  onClick={() => {
                    soundEffects.play('tap');
                    importInputRef.current?.click();
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-badge hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                >
                  <Upload size={24} className="text-secondary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Import File</span>
                </button>

                <button 
                  onClick={async () => {
                    soundEffects.play('tap');
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                      const token = `NOTIFY_SYNC:${session.access_token}:${session.refresh_token}`;
                      setSyncToken(token);
                      setShowQR(true);
                      toast.success("Sync Token Generated!");
                    } else {
                      toast.error("Not logged in!");
                    }
                  }}
                  className="col-span-2 flex flex-row items-center justify-center gap-3 p-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 transition-all border border-blue-500/30 active:scale-95 mt-2 group"
                >
                  <Hash size={20} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Generate Pairing Token</span>
                </button>
                <input 
                  ref={importInputRef}
                  type="file" 
                  accept=".json,application/json,text/plain,*/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    
                    toast.info(`Preparing to read ${file.name}...`, { duration: 1500 });

                    reader.onload = async (event) => {
                      const content = event.target?.result as string;
                      if (!content) {
                        toast.error("Could not read file content");
                        return;
                      }

                      try {
                        const success = await importNotes(content);
                        if (success) {
                          setShowUserInfo(false);
                        }
                      } catch (err) {
                        console.error("Import processing error:", err);
                        toast.error("Crash avoided: The backup file is too complex to process.");
                      }
                    };
                    
                    reader.onerror = (err) => {
                      console.error("FileReader error:", err);
                      toast.error("Failed to read file from disk");
                    };

                    reader.readAsText(file);
                    
                    // Reset value so same file can be selected again
                    if (importInputRef.current) importInputRef.current.value = '';
                  }}
                />
              </div>

              <div className="w-full mb-6">
                <button 
                  onClick={() => {
                    soundEffects.play('tap');
                    forceSync();
                  }}
                  disabled={syncStatus === 'syncing'}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl glass-badge transition-all active:scale-[0.98] ${
                    syncStatus === 'syncing' ? 'border-blue-400/30' : 
                    syncStatus === 'success' ? 'border-emerald-400/30' : 
                    'border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      syncStatus === 'syncing' ? 'bg-blue-500/20 text-blue-400' :
                      syncStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                      syncStatus === 'error' ? 'bg-destructive/20 text-destructive' :
                      'bg-white/10 text-muted-foreground'
                    }`}>
                      <RefreshCw size={18} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">Cloud Sync</p>
                      <p className="text-[9px] font-medium text-muted-foreground">
                        {syncStatus === 'syncing' ? 'Syncing with Supabase...' : 
                         syncStatus === 'success' ? 'All notes backed up' : 
                         syncStatus === 'error' ? 'Connection error' : 'Sync now'}
                      </p>
                    </div>
                  </div>
                  {syncStatus === 'success' && <Check size={16} className="text-emerald-400" />}
                </button>
              </div>

              <div className="w-full mb-6">
                <button 
                  onClick={handleAIMemoryExport}
                  disabled={isExportingAI}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl glass-badge border-blue-500/20 bg-blue-500/5 transition-all active:scale-[0.98] hover:bg-blue-500/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                      <Globe size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Sync with AI</p>
                      <p className="text-[9px] font-medium text-muted-foreground/80">Export Brain Dump for ChatGPT</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-400/50">
                    <Download size={14} />
                  </div>
                </button>
              </div>

              <div className="w-full mb-3">
                <button 
                  onClick={() => {
                    setShowUserInfo(false);
                    setIsAIChatOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 transition-all active:scale-[0.98] hover:bg-indigo-500/10 group shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                      <Sparkles size={18} fill="currentColor" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Consult Assistant</p>
                      <p className="text-[9px] font-medium text-muted-foreground/80">Live chat with your notes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-400/50">
                    <ChevronRight size={14} />
                  </div>
                </button>
              </div>

              <div className="w-full mb-3">
                <button 
                  onClick={async () => {
                    soundEffects.play('tap');
                    toast.info("Sending test notification in 2 seconds...");
                    // Small delay to let the toast show up
                    setTimeout(async () => {
                      await scheduleNotification("Test Notification", "If you see this, notifications are working perfectly! 🎉");
                    }, 2000);
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 rounded-2xl glass-badge border-white/10 transition-all active:scale-[0.98] hover:bg-white/5 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 text-muted-foreground">
                      <Bell size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">Diagnostic Test</p>
                      <p className="text-[9px] font-medium text-muted-foreground">Verify push notifications</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => {
                  soundEffects.play('tap');
                  onLogout();
                }} className="flex flex-col items-center gap-2 p-3 rounded-2xl glass-btn text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Logout</span>
                </button>
                <button onClick={() => {
                  soundEffects.play('swoosh');
                  setShowUserInfo(false);
                }} className="flex flex-col items-center gap-2 p-3 rounded-2xl glass-primary text-primary-foreground">
                  <Check size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEffects.play('tap');
                setShowUserInfo(true);
              }}
              className="w-10 h-10 rounded-2xl glass-icon overflow-hidden border border-white/20 shadow-lg"
            >
              <img src={notifyLogo} alt="Notify" className="w-full h-full object-cover" />
            </button>
            <button 
              onClick={() => {
                soundEffects.play('tap');
                setShowUserInfo(true);
              }}
              className="text-left"
            >
              <h1 className="text-2xl font-heading font-extrabold gradient-text">Notify</h1>
              <p className="text-[11px] text-muted-foreground font-body -mt-0.5">Hi, {userName || 'User'} 👋</p>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-full border border-white/5">{notes.length} Notes</span>
          </div>
        </div>

        <div className="relative mb-4">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-body outline-none glass-input"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
          {allCategories.map((cat, i) => {
            const isCustom = i > 0; const customIdx = i - 1; const isEditing = isCustom && editingCatIdx === customIdx;
            if (isEditing) {
              return (
                <div key={cat} className="flex items-center gap-1 flex-shrink-0">
                  <input autoFocus value={editCatName} onChange={e => setEditCatName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') renameCategory(customIdx); if (e.key === 'Escape') setEditingCatIdx(null); }}
                    className="px-3 py-2 rounded-xl text-sm font-body font-semibold glass-input outline-none w-24" />
                  <button onClick={() => renameCategory(customIdx)} className="p-1.5 rounded-xl glass-primary text-primary-foreground"><Check size={13} /></button>
                  <button onClick={() => deleteCategory(customIdx)} className="p-1.5 rounded-xl glass-btn text-destructive"><X size={13} /></button>
                </div>
              );
            }
            return (
              <button key={cat} onClick={() => {
                soundEffects.play('tap');
                setSelectedCategory(cat);
              }} onDoubleClick={() => { if (isCustom) { setEditingCatIdx(customIdx); setEditCatName(cat); } }}
                className={`px-4 py-2 rounded-xl text-sm font-body font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat ? 'glass-tab-active text-primary-foreground' : 'glass-btn text-foreground/60'}`}>
                {cat}
              </button>
            );
          })}
          {addingCategory ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') { setAddingCategory(false); setNewCatName(''); } }}
                placeholder="Name..." className="px-3 py-2 rounded-xl text-sm font-body font-semibold glass-input outline-none w-24 placeholder:text-muted-foreground" />
              <button onClick={addCategory} className="p-1.5 rounded-xl glass-primary text-primary-foreground"><Check size={13} /></button>
              <button onClick={() => { setAddingCategory(false); setNewCatName(''); }} className="p-1.5 text-muted-foreground"><X size={13} /></button>
            </div>
          ) : (
            <button onClick={() => setAddingCategory(true)} className="w-9 h-9 rounded-xl glass-icon flex items-center justify-center text-muted-foreground hover:text-primary flex-shrink-0">
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-3xl glass-card mx-auto mb-4 overflow-hidden">
              <img src={notifyLogo} alt="Notify" className="w-full h-full object-cover opacity-30" />
            </div>
            <p className="text-muted-foreground font-heading font-bold">No notes yet</p>
            <p className="text-sm text-muted-foreground/60 font-body mt-1">Tap + to create your first note</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            {filtered.map((note, i) => (
              <div key={note.id} className={`transition-transform ${dragOverId === note.id ? 'scale-[0.985]' : ''}`}>
                <NoteCard 
                  note={note} 
                  index={i} 
                  isDragging={dragId === note.id} 
                  isDropTarget={dragOverId === note.id && dragId !== note.id}
                  onClick={() => {
                    setEditingId(note.id);
                  }} 
                  onPin={() => {
                    soundEffects.play('chime');
                    togglePin(note.id);
                  }} 
                  onDragStart={handleDragStart} 
                  onDragOver={e => handleDragOver(e, note.id)}
                  onDrop={handleDrop} 
                  onDragEnd={handleDragEnd} 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewColorPicker && (
        <div className="fixed bottom-24 right-5 rounded-[2rem] glass-strong p-3 flex gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {quickColors.map(c => (
            <button key={c} onClick={() => handleNew(c)} className={`w-11 h-11 rounded-2xl note-card-${c} glass-icon transition-all hover:scale-110 active:scale-95 shadow-lg`} />
          ))}
        </div>
      )}

      <button onClick={() => {
        soundEffects.play('tap');
        setShowNewColorPicker(!showNewColorPicker);
      }}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-2xl glass-fab text-primary-foreground flex items-center justify-center shadow-lg transition-transform active:scale-90 z-50">
        <Plus size={28} className={`transition-transform duration-300 ${showNewColorPicker ? 'rotate-45' : ''}`} />
      </button>

      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div onClick={() => setShowQR(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <div className="w-full max-w-sm glass-strong p-8 rounded-[2.5rem] relative z-10 border border-white/20 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="bg-[#1a1a1b] p-6 rounded-3xl border border-white/5 space-y-3">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Your Pairing Token</label>
              <div className="p-4 bg-black/40 rounded-xl font-mono text-[10px] text-blue-400 break-all leading-tight border border-blue-500/10">
                {syncToken}
              </div>
            </div>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">
              Copy this token and paste it into the "Login with Pairing Token" option on your phone.
            </p>
            <div className="space-y-3">
              <button 
                onClick={async () => {
                  await navigator.clipboard.writeText(syncToken);
                  toast.success("Token copied!");
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                Copy Manual Token
              </button>
              <button onClick={() => setShowQR(false)} className="w-full py-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
