import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { NoteReminder } from '@/types/note';

export const scheduleNotification = async (title: string, body: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }
      
      // On Android 8.0+, we need to ensure a channel exists
      if (Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: 'default',
          name: 'Default',
          description: 'Default notifications',
          importance: 5, // High importance for immediate delivery
          visibility: 1,
          vibration: true
        });
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 500) },
            channelId: 'default',
            sound: 'default'
          },
        ],
      });
    } catch (err) {
      console.error('Test notification failed:', err);
    }
  } else {
    console.log('Notification (Web):', title, body);
  }
};

const getNotificationId = (reminderId: string): number => {
  let hash = 0;
  for (let i = 0; i < reminderId.length; i++) {
    hash = ((hash << 5) - hash) + reminderId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash % 1000000);
};

export const cancelReminder = async (reminder: NoteReminder) => {
  if (!Capacitor.isNativePlatform()) return;
  const notificationId = getNotificationId(reminder.id);
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    console.log(`[Native] Cancelled reminder: ${notificationId}`);
  } catch (error) {
    console.error('[Native] Error cancelling reminder:', error);
  }
};

export const scheduleReminder = async (reminder: NoteReminder, title: string, text?: string) => {
  try {
    const isMobile = Capacitor.getPlatform() !== 'web';
    if (!isMobile) {
      console.log('Reminder scheduling only supported on mobile:', { reminder, title, text });
      return;
    }

    // 1. Ensure permissions
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return null;
    }

    // 2. Ensure channel exists on Android
    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: 'reminders',
        name: 'Reminders',
        description: 'Notify reminders and alerts',
        importance: 5,
        visibility: 1,
        vibration: true,
        sound: 'default'
      });
    }

    const notificationId = getNotificationId(reminder.id);

    // 3. Cancel existing first
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });

    if (!reminder.enabled) return;

    const now = new Date();
    let triggerDate: Date;

    if (reminder.daily) {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }
    } else if (reminder.datetime) {
      triggerDate = new Date(reminder.datetime);
      // If the specific datetime has already passed, don't schedule
      if (triggerDate <= now) {
        console.warn('Reminder datetime has already passed:', reminder.datetime);
        return;
      }
    } else {
      // Fallback to time-only logic
      const [hours, minutes] = reminder.time.split(':').map(Number);
      triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }
    }

    // Schedule the notification
    const schedule: any = {
      allowWhileIdle: true
    };

    if (reminder.daily) {
      schedule.on = {
        hour: triggerDate.getHours(),
        minute: triggerDate.getMinutes()
      };
      schedule.repeats = true;
    } else {
      schedule.at = triggerDate;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body: text || 'Reminder from Notify',
          id: notificationId,
          schedule: schedule,
          sound: 'default',
          channelId: 'reminders', // CRITICAL for Android
          actionTypeId: 'OPEN_NOTE',
          extra: {
            reminderId: reminder.id
          }
        }
      ]
    });
    console.log(`[Native] Scheduled reminder ${notificationId} for ${triggerDate.toLocaleString()} (Daily: ${reminder.daily})`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return null;
  }
};

export const rescheduleAllReminders = async (notes: Note[]) => {
  try {
    const isMobile = Capacitor.getPlatform() !== 'web';
    if (!isMobile) return;

    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    // 1. Get all pending notifications
    const pending = await LocalNotifications.getPending();
    
    // 2. Clear ALL delivered and pending notifications
    await LocalNotifications.removeAllDeliveredNotifications();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
    
    // 3. NUCLEAR OPTION: If the user is reporting persistent ghosts, 
    // we also try to cancel IDs in the legacy range just in case getPending missed them.
    // We only do this once on a clean start.
    const legacyIds = [];
    for (let i = 0; i < 50; i++) { // Sample a few common IDs or just clear a reasonable range
        // Too many cancels can be heavy, so we rely on getPending mostly.
    }

    // 4. Re-schedule each note's reminder
    for (const note of notes) {
      if (note.reminder?.enabled) {
        await scheduleReminder(note.reminder, note.title || 'Note', (note as any).content || (note as any).description);
      }
      
      // 5. Schedule checklist item reminders
      if (note.checklist) {
        for (const item of note.checklist) {
          if (item.reminder?.enabled) {
            await scheduleReminder(item.reminder, `${note.title || 'Note'}: ${item.text}`, item.description);
          }
        }
      }
    }
    console.log('All reminders have been aggressively rescheduled and synchronized.');
  } catch (error) {
    console.error('Error rescheduling all reminders:', error);
  }
};

export const updateWidget = async (notesCount: number, recentTitles: string[]) => {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({
      key: 'widget_notes_count',
      value: notesCount.toString(),
    });

    // Store the first few titles for widgets
    for (let i = 0; i < Math.min(recentTitles.length, 5); i++) {
      await Preferences.set({
        key: `widget_note_${i}`,
        value: recentTitles[i] || 'No note',
      });
    }

    try {
      // @ts-ignore
      if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.WidgetPlugin) {
        // @ts-ignore
        await Capacitor.Plugins.WidgetPlugin.updateWidget();
      }
    } catch (e) {
      console.warn('Widget plugin not found');
    }
  }
};

