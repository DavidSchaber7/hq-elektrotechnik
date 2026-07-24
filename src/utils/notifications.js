import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getSettings, saveSettings, getStreak } from './storage';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

// Request permission
export async function requestNotificationPermission() {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Lernerinnerungen',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }

  return true;
}

// Schedule daily reminder notification
export async function scheduleDailyReminder() {
  // Cancel existing reminders first
  await cancelAllReminders();

  const settings = await getSettings();
  if (settings.notificationsEnabled === false) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Evening reminder at 19:00 - "Hast du heute schon gelernt?"
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'HQ Prüfung Elektrotechnik',
      body: 'Hast du heute schon gelernt? Halte deine Streak aufrecht!',
      sound: null,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 19,
      minute: 0,
    },
  });

  // Morning motivation at 8:00
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Guten Morgen!',
      body: 'Starte den Tag mit ein paar HQ-Fragen.',
      sound: null,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
}

// Cancel when daily goal is reached
export async function cancelTodayReminder() {
  // We keep the schedule but could set badge to 0
  await Notifications.setBadgeCountAsync(0);
}

// Cancel all scheduled notifications
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Update notifications based on streak
export async function updateStreakNotification() {
  const streak = await getStreak();
  const settings = await getSettings();

  if (settings.notificationsEnabled === false) return;
  if (streak.todayCount >= streak.dailyGoal) {
    // Goal reached - clear badge
    await Notifications.setBadgeCountAsync(0);
  } else {
    // Set badge to remaining questions
    const remaining = streak.dailyGoal - streak.todayCount;
    await Notifications.setBadgeCountAsync(remaining);
  }
}

// Initialize notifications on app start
export async function initNotifications() {
  const settings = await getSettings();

  // First launch - ask for permission and enable
  if (settings.notificationsEnabled === undefined) {
    const granted = await requestNotificationPermission();
    await saveSettings({ notificationsEnabled: granted });
    if (granted) {
      await scheduleDailyReminder();
    }
  } else if (settings.notificationsEnabled) {
    await scheduleDailyReminder();
  }

  await updateStreakNotification();
}

// Schedule exam date countdown notifications (7 days and 1 day before)
export async function scheduleExamReminders(examDateStr) {
  if (!examDateStr) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Cancel existing exam reminders (use tag via identifier)
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.identifier?.startsWith('exam_reminder_')) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {}

  const examDate = new Date(examDateStr);
  const now = new Date();

  const schedule = [
    { daysBefore: 7, title: 'Noch 7 Tage bis zur Prüfung! 📅', body: 'Jetzt intensiv üben – du schaffst das!' },
    { daysBefore: 3, title: 'Noch 3 Tage bis zur Prüfung! ⏳', body: 'Letzte Kilometer – alle Schwächen nochmal wiederholen.' },
    { daysBefore: 1, title: 'Morgen ist Prüfungstag! 💪', body: 'Heute noch einmal kurz wiederholen, dann früh schlafen.' },
  ];

  for (const { daysBefore, title, body } of schedule) {
    const triggerDate = new Date(examDate);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(8, 0, 0, 0);
    if (triggerDate > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `exam_reminder_${daysBefore}`,
        content: { title, body, sound: null },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    }
  }
}

// Toggle notifications on/off
export async function toggleNotifications(enabled) {
  await saveSettings({ notificationsEnabled: enabled });
  if (enabled) {
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleDailyReminder();
    }
    return granted;
  } else {
    await cancelAllReminders();
    await Notifications.setBadgeCountAsync(0);
    return false;
  }
}
