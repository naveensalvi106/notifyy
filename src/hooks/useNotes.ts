import { useState, useEffect, useCallback, useRef } from 'react';
import { Note, NoteColor } from '@/types/note';
import { v4 as uuidv4 } from 'uuid';
import { updateWidget, scheduleReminder, cancelReminder, rescheduleAllReminders } from '@/lib/native';
import { supabase } from '@/integrations/supabase/client';
import { deleteLocalMedia } from '@/lib/db';

import { Preferences } from '@capacitor/preferences';
import { toast } from 'sonner';

const getStorageKey = (userId: string | null) => userId ? `easynotes_data_${userId}` : 'easynotes_data_guest';
const getOrderKey = (userId: string | null) => userId ? `easynotes_order_${userId}` : 'easynotes_order_guest';

const repairNote = (n: any): Note => ({
  id: n.id || uuidv4(),
  title: n.title || '',
  content: n.content || '',
  color: (n.color as NoteColor) || 'yellow',
  checklist: Array.isArray(n.checklist) ? n.checklist.map((i: any) => ({
    ...i,
    description: i.description || '',
    reminder: i.reminder || undefined
  })) : [],
  mindmap: Array.isArray(n.mindmap) ? n.mindmap : [],
  media: Array.isArray(n.media) ? n.media : [],
  reminder: n.reminder || undefined,
  pinned: !!n.pinned,
  category: n.category || 'All',
  isDeleted: !!n.is_deleted || !!n.isDeleted,
  createdAt: n.createdAt || n.created_at || new Date().toISOString(),
  updatedAt: n.updatedAt || n.updated_at || new Date().toISOString(),
});

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);
  const remindersRescheduled = useRef(false);
  const reminderTimeouts = useRef<Map<string, any>>(new Map());
  const lastScheduledRef = useRef<Map<string, string>>(new Map()); // Key: ID (rem or checklist), Value: JSON string of settings

  const fetchNotesFromCloud = useCallback(async (currentUserId: string) => {
    try {
      setSyncStatus('syncing');
      console.log('Fetching cloud notes for:', currentUserId);
      
      const [notesRes, profileRes] = await Promise.all([
        supabase.from('notes').select('*').eq('user_id', currentUserId),
        supabase.from('profiles').select('notes_order, categories').eq('user_id', currentUserId).maybeSingle()
      ]);

      if (notesRes.error) throw notesRes.error;

      if (notesRes.data) {
        const cloudNotes = notesRes.data.map(n => ({
          ...repairNote(n),
          createdAt: n.created_at,
          updatedAt: n.updated_at
        }));

        // Get local notes to merge
        const localData = localStorage.getItem(getStorageKey(currentUserId));
        const localNotes: Note[] = localData ? JSON.parse(localData) : [];
        
        // Merge logic: 
        // 1. Cloud wins for existing notes
        // 2. If a note is marked deleted in cloud, it MUST be removed locally
        const mergedMap = new Map<string, Note>();
        localNotes.forEach(n => mergedMap.set(n.id, n));
        cloudNotes.forEach(n => {
          if (n.isDeleted) {
            mergedMap.delete(n.id);
          } else {
            const existing = mergedMap.get(n.id);
            if (!existing || new Date(n.updatedAt) > new Date(existing.updatedAt)) {
              mergedMap.set(n.id, n);
            }
          }
        });
        
        const merged = Array.from(mergedMap.values());
        setNotes(merged);
        localStorage.setItem(getStorageKey(currentUserId), JSON.stringify(merged));
        
        if (!remindersRescheduled.current && merged.length > 0) {
          rescheduleAllReminders(merged);
          remindersRescheduled.current = true;
        }
        setSyncStatus('success');
      }

      if (profileRes.data) {
        if (profileRes.data.notes_order) {
          setOrder(profileRes.data.notes_order);
          localStorage.setItem(getOrderKey(currentUserId), JSON.stringify(profileRes.data.notes_order));
        }
        if (profileRes.data.categories) {
          const cloudCats = profileRes.data.categories as string[];
          setCategories(cloudCats);
          localStorage.setItem('easynotes_categories', JSON.stringify(cloudCats));
        }
      }
    } catch (err) {
      console.error('Cloud fetch failed:', err);
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync state when userId changes
  useEffect(() => {
    setLoading(true);

    const migrateGuestData = async (newUserId: string) => {
      const guestNotesKey = getStorageKey(null);
      const guestOrderKey = getOrderKey(null);
      const guestNotesJSON = localStorage.getItem(guestNotesKey);
      const guestOrderJSON = localStorage.getItem(guestOrderKey);

      if (guestNotesJSON) {
        try {
          const guestNotes: Note[] = JSON.parse(guestNotesJSON);
          const userNotesKey = getStorageKey(newUserId);
          const userOrderKey = getOrderKey(newUserId);
          const userNotesJSON = localStorage.getItem(userNotesKey);
          const userOrderJSON = localStorage.getItem(userOrderKey);

          let userNotes: Note[] = [];
          let userOrder: string[] = [];
          if (userNotesJSON) userNotes = JSON.parse(userNotesJSON);
          if (userOrderJSON) userOrder = JSON.parse(userOrderJSON);

          // Merge guest notes into user notes (avoiding duplicates by ID)
          const mergedNotes = [...userNotes];
          const mergedOrder = [...userOrder];

          guestNotes.forEach(gn => {
            if (!mergedNotes.some(un => un.id === gn.id)) {
              mergedNotes.push(gn);
              mergedOrder.push(gn.id);
            }
          });

          // Save migrated data
          localStorage.setItem(userNotesKey, JSON.stringify(mergedNotes));
          localStorage.setItem(userOrderKey, JSON.stringify(mergedOrder));

          // Clear guest data AFTER successful migration to avoid redundancy
          localStorage.removeItem(guestNotesKey);
          localStorage.removeItem(guestOrderKey);

          console.log(`Migrated ${guestNotes.length} notes from guest to user ${newUserId}`);
          
          // Trigger a background bulk sync for these new notes
          if (mergedNotes.length > 0) {
            const dbNotes = mergedNotes.map(n => ({
              id: n.id,
              user_id: newUserId,
              title: n.title,
              content: n.content,
              color: n.color,
              checklist: n.checklist,
              mindmap: n.mindmap,
              media: n.media,
              pinned: n.pinned,
              category: n.category,
              created_at: n.createdAt,
              updated_at: n.updatedAt
            }));
            
            // Perform bulk upsert in chunks of 50 to be safe
            for (let i = 0; i < dbNotes.length; i += 50) {
              const chunk = dbNotes.slice(i, i + 50);
              supabase.from('notes').upsert(chunk).catch(e => console.error('Bulk sync chunk failed:', e));
            }
          }
        } catch (err) {
          console.error('Migration failed:', err);
        }
      }
    };

    if (userId) {
      migrateGuestData(userId);
    }

    // 1. Instant local load with legacy recovery
    const currentKey = getStorageKey(userId);
    let localNotesRaw = localStorage.getItem(currentKey);
    
    // Recovery logic for different app versions
    if (!localNotesRaw) {
      const legacyKeys = ['notify_notes', 'notes', 'notify-data', 'notify-notes'];
      for (const key of legacyKeys) {
        const legacyData = localStorage.getItem(key);
        if (legacyData) {
          console.log(`Found legacy data in ${key}, recovering...`);
          localNotesRaw = legacyData;
          localStorage.setItem(currentKey, legacyData);
          break;
        }
      }
    }

    const localOrder = localStorage.getItem(getOrderKey(userId));

    // Advanced recovery from Capacitor Preferences (if previously used)
    const checkNativeStorage = async () => {
      try {
        const { value: nativeNotes } = await Preferences.get({ key: 'notes' });
        if (nativeNotes && !localNotesRaw) {
          console.log('Recovered notes from native storage');
          localNotesRaw = nativeNotes;
          localStorage.setItem(currentKey, nativeNotes);
          // Trigger refresh
          const parsed = JSON.parse(nativeNotes);
          if (Array.isArray(parsed)) setNotes(parsed.map(repairNote));
        }
      } catch {}
    };
    checkNativeStorage();

    if (localNotesRaw) {
      try {
        const parsed = JSON.parse(localNotesRaw);
        if (Array.isArray(parsed)) {
          const repaired = parsed.map(repairNote);
          setNotes(repaired);
          setLoading(false);
          
          if (!remindersRescheduled.current && repaired.length > 0) {
            rescheduleAllReminders(repaired);
            remindersRescheduled.current = true;
          }
        }
      } catch (err) {
        console.error('Local load failed:', err);
      }
    }

    if (localOrder) {
      try {
        const parsed = JSON.parse(localOrder);
        if (Array.isArray(parsed)) setOrder(parsed);
      } catch {}
    }

    // Load initial categories
    const localCats = localStorage.getItem('easynotes_categories');
    if (localCats) {
      try {
        const parsed = JSON.parse(localCats);
        if (Array.isArray(parsed)) setCategories(parsed);
      } catch {}
    }

    if (userId) {
      fetchNotesFromCloud(userId);
    } else {
      setLoading(false);
    }
  }, [userId, fetchNotesFromCloud]);

  const [searchQuery, setSearchQuery] = useState('');

  const syncOrder = useCallback(async (newOrder: string[]) => {
    setOrder(newOrder);
    localStorage.setItem(getOrderKey(userId), JSON.stringify(newOrder));
    if (userId) {
      await supabase.from('profiles').upsert({ user_id: userId, notes_order: newOrder }, { onConflict: 'user_id' });
    }
  }, [userId]);

  const createNote = useCallback(async (color: NoteColor = 'yellow', category: string = 'All') => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const newNote: Note = {
      id, title: '', content: '', color, media: [], checklist: [], mindmap: [],
      pinned: false, category, createdAt: now, updatedAt: now
    };

    const nextNotes = [newNote, ...notes];
    const nextOrder = [id, ...order];

    setNotes(nextNotes);
    setOrder(nextOrder);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(nextNotes));
    localStorage.setItem(getOrderKey(userId), JSON.stringify(nextOrder));

    if (userId) {
      supabase.from('notes').upsert({
        id, user_id: userId, title: '', content: '', color, checklist: [], mindmap: [], media: [], pinned: false, category
      }).catch(() => {});
      supabase.from('profiles').upsert({ user_id: userId, notes_order: nextOrder }).catch(() => {});
    }
    return id;
  }, [notes, order, userId]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const now = new Date().toISOString();
    const oldNote = notes.find(n => n.id === id);
    const updatedNote = { ...oldNote, ...updates } as Note;
    
    setNotes(prev => {
      const next = prev.map(n => n.id === id ? { ...updatedNote, updatedAt: now } : n);
      localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
      return next;
    });

    if (userId) {
      const dbNote = { 
        ...updatedNote, 
        user_id: userId, 
        updated_at: now,
        created_at: updatedNote.createdAt // Map to DB column
      };
      // Remove local-only fields
      delete (dbNote as any).createdAt;
      delete (dbNote as any).updatedAt;
      
      supabase.from('notes').upsert(dbNote).catch(err => {
        console.error('Cloud update failed, will retry on force sync:', err);
      });
    }

    // Using a ref to track active debounced schedules to prevent race conditions
    const timeouts = reminderTimeouts.current;

    const isSameRem = (r1?: any, r2?: any) => {
      if (!r1 && !r2) return true;
      if (!r1 || !r2) return false;
      return r1.time === r2.time && r1.daily === r2.daily && r1.enabled === r2.enabled;
    };

    // 1. Check main note reminder
    const reminderRemoved = !!oldNote?.reminder && !updatedNote.reminder;
    const reminderConfigChanged = !isSameRem(oldNote?.reminder, updatedNote.reminder);
    const titleChanged = oldNote?.title !== updatedNote.title;

    if (reminderRemoved) {
      // If it was removed entirely, cancel it immediately
      await cancelReminder(oldNote!.reminder!);
    } else if (reminderConfigChanged || (titleChanged && updatedNote.reminder)) {
      if (timeouts.has(id)) clearTimeout(timeouts.get(id));
      
      timeouts.set(id, setTimeout(async () => {
        if (updatedNote.reminder) {
          if (updatedNote.reminder.enabled) {
            await scheduleReminder(updatedNote.reminder, updatedNote.title || 'Note', updatedNote.content);
          } else {
            await cancelReminder(updatedNote.reminder);
          }
        }
        timeouts.delete(id);
      }, 1500));
    }

    // 2. Check checklist reminders
    const oldChecklist = oldNote?.checklist || [];
    const newChecklist = updatedNote.checklist || [];

    // Handle items that might have been removed or had reminders removed
    for (const oldItem of oldChecklist) {
      if (oldItem.reminder) {
        const newItem = newChecklist.find(i => i.id === oldItem.id);
        if (!newItem || !newItem.reminder) {
          // Item was deleted or reminder was removed - cancel it
          await cancelReminder(oldItem.reminder);
        }
      }
    }

    // Handle new or updated reminders
    for (const item of newChecklist) {
      if (item.reminder) {
        const oldItem = oldChecklist.find(i => i.id === item.id);
        const itemRemChanged = !isSameRem(oldItem?.reminder, item.reminder);
        const itemTextChanged = oldItem?.text !== item.text;

        if (itemRemChanged || itemTextChanged) {
          const timeoutKey = `checklist-${item.id}`;
          if (timeouts.has(timeoutKey)) clearTimeout(timeouts.get(timeoutKey));

          timeouts.set(timeoutKey, setTimeout(async () => {
            if (item.reminder!.enabled) {
              await scheduleReminder(item.reminder!, `${updatedNote.title || 'Note'}: ${item.text || 'Task'}`, item.description);
            } else {
              await cancelReminder(item.reminder!);
            }
            timeouts.delete(timeoutKey);
          }, 1500));
        }
      }
    }
  }, [notes, userId]);

  const deleteNote = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    
    // Cancel all associated reminders
    if (note?.reminder) {
      await cancelReminder(note.reminder);
    }
    if (note?.checklist) {
      for (const item of note.checklist) {
        if (item.reminder) {
          await cancelReminder(item.reminder);
        }
      }
    }

    if (note?.media) {
      note.media.forEach(m => {
        if (m.url.startsWith('local-')) deleteLocalMedia(m.url).catch(() => {});
      });
    }

    const now = new Date().toISOString();
    
    // 1. Local removal
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
      return next;
    });
    setOrder(prev => {
      const next = prev.filter(oid => oid !== id);
      localStorage.setItem(getOrderKey(userId), JSON.stringify(next));
      return next;
    });

    // 2. Soft delete in cloud so other devices know it's gone
    if (userId) {
      supabase.from('notes').upsert({
        id, 
        user_id: userId, 
        is_deleted: true,
        updated_at: now
      }).catch(e => console.error('Soft delete sync failed:', e));
    }
  }, [userId, notes]);

  const togglePin = useCallback(async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    updateNote(id, { pinned: !note.pinned });
  }, [notes, updateNote]);

  const reorderNotes = useCallback(async (fromId: string, toId: string) => {
    const noteIds = notes.map(n => n.id);
    const normalized = [...order.filter(id => noteIds.includes(id)), ...noteIds.filter(id => !order.includes(id))];
    const fromIdx = normalized.indexOf(fromId);
    const toIdx = normalized.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const next = [...normalized];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    syncOrder(next);
  }, [notes, order, syncOrder]);

  useEffect(() => {
    if (notes.length > 0) {
      const top = [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const ai = order.indexOf(a.id);
        const bi = order.indexOf(b.id);
        if (ai !== -1 && bi !== -1) return ai - bi;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }).slice(0, 5);
      updateWidget(notes.length, top.map(n => n.title || "Untitled"));
    }
  }, [notes, order]);

  const filteredNotes = notes
    .filter(n => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      if (ai !== -1 && bi !== -1) return ai - bi;
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA; // Newest first fallback
    });

  const forceSync = useCallback(async () => {
    if (!userId) {
      toast.error("Please log in to sync");
      return;
    }
    setLoading(true);
    setSyncStatus('syncing');
    try {
      await fetchNotesFromCloud(userId);
      
      if (notes.length > 0) {
        // Aggressively push all local notes
        const syncPromises = notes.map(n => {
          const dbNote = {
            id: n.id,
            user_id: userId,
            title: n.title,
            content: n.content,
            color: n.color,
            checklist: n.checklist,
            mindmap: n.mindmap,
            media: n.media,
            pinned: n.pinned,
            category: n.category,
            created_at: n.createdAt,
            updated_at: n.updatedAt,
            reminder: n.reminder
          };
          return supabase.from('notes').upsert(dbNote);
        });
        
        const results = await Promise.all(syncPromises);
        const error = results.find(r => r.error)?.error;
        if (error) throw error;
      }
      
      setSyncStatus('success');
      toast.success(`Successfully synced ${notes.length} notes!`);
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      setSyncStatus('error');
      toast.error("Sync failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [userId, notes, fetchNotesFromCloud]);

  const exportNotes = useCallback(() => {
    const data = {
      notes,
      order,
      categories: JSON.parse(localStorage.getItem('easynotes_categories') || '[]'),
      exportedAt: new Date().toISOString(),
      version: '1.2.5'
    };
    return JSON.stringify(data, null, 2);
  }, [notes, order]);

  const importNotes = useCallback(async (jsonString: string) => {
    try {
      if (!jsonString || jsonString.length < 2) throw new Error('File is empty or too small');
      
      console.log('Import processing start:', jsonString.substring(0, 100) + '...');
      const data = JSON.parse(jsonString);
      
      let importedNotes: Note[] = [];
      let importedOrder: string[] = [];
      let importedCategories: string[] = [];

      // Support various formats
      if (Array.isArray(data)) {
        importedNotes = data.map(repairNote);
      } else if (data && typeof data === 'object') {
        const rawNotes = Array.isArray(data.notes) ? data.notes : (Array.isArray(data) ? data : []);
        if (rawNotes.length > 0) {
          importedNotes = rawNotes.map(repairNote);
        } else if (data.id) {
          // Single note
          importedNotes = [repairNote(data)];
        }
        
        if (Array.isArray(data.order)) importedOrder = data.order;
        if (Array.isArray(data.categories)) importedCategories = data.categories;
      }

      if (importedNotes.length === 0) {
        throw new Error('No valid notes found in this file format');
      }

      console.log(`Processing ${importedNotes.length} notes for merge...`);
      
      // Calculate merge
      const currentNotes = [...notes];
      const mergedMap = new Map<string, Note>();
      currentNotes.forEach(n => { if (n && n.id) mergedMap.set(n.id, n); });
      
      importedNotes.forEach(n => {
        if (!n || !n.id) return;
        const existing = mergedMap.get(n.id);
        if (!existing || new Date(n.updatedAt) > new Date(existing.updatedAt)) {
          mergedMap.set(n.id, n);
        }
      });
      
      const finalNotes = Array.from(mergedMap.values());
      
      // Update state
      setNotes(finalNotes);
      if (importedOrder.length > 0) setOrder(importedOrder);
      
      // Handle persistence sequentially
      setTimeout(() => {
        try {
          localStorage.setItem(getStorageKey(userId), JSON.stringify(finalNotes));
          if (importedOrder.length > 0) {
            localStorage.setItem(getOrderKey(userId), JSON.stringify(importedOrder));
          }
          if (importedCategories.length > 0) {
            localStorage.setItem('easynotes_categories', JSON.stringify(importedCategories));
          }
        } catch (e) {
          console.error('LocalStorage persistence failed during import:', e);
          toast.error('Local storage full, notes imported to session only');
        }

        // Perform bulk cloud sync if logged in
        if (userId) {
          console.log('Starting background cloud sync for imported notes...');
          const dbNotes = finalNotes.map(n => ({
            id: n.id,
            user_id: userId,
            title: n.title,
            content: n.content,
            color: n.color,
            checklist: n.checklist,
            mindmap: n.mindmap,
            media: n.media,
            pinned: n.pinned,
            category: n.category,
            created_at: n.createdAt,
            updated_at: n.updatedAt
          }));

          for (let i = 0; i < dbNotes.length; i += 50) {
            const chunk = dbNotes.slice(i, i + 50);
            supabase.from('notes').upsert(chunk).then(({ error }) => {
              if (error) console.error('Cloud chunk sync error:', error);
            });
          }
        }
      }, 500);

      toast.success(`Import complete! Loaded ${importedNotes.length} notes.`);
      return true;
    } catch (err) {
      console.error('CRITICAL IMPORT ERROR:', err);
      const msg = err instanceof Error ? err.message : 'Invalid file format';
      toast.error(`Import Error: ${msg}`);
      return false;
    }
  }, [userId, notes]); // Added notes as dependency for proper merging

  const updateCategories = useCallback(async (newCats: string[]) => {
    setCategories(newCats);
    localStorage.setItem('easynotes_categories', JSON.stringify(newCats));
    if (userId) {
      await supabase.from('profiles').upsert({ user_id: userId, categories: newCats }, { onConflict: 'user_id' });
    }
  }, [userId]);

  return { 
    notes: filteredNotes, 
    allNotes: notes, 
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
    categories,
    updateCategories
  };
}
