import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROGRESS: 'hq_progress',
  BOOKMARKS: 'hq_bookmarks',
  EXAM_HISTORY: 'hq_exam_history',
  STREAK: 'hq_streak',
  SETTINGS: 'hq_settings',
  SRS: 'hq_srs',
  PREMIUM: 'hq_premium', // { unlocked: boolean, purchasedAt: ISOString | null }
};

// ==================== PREMIUM (IAP) ====================
export async function getPremium() {
  try {
    const data = await AsyncStorage.getItem(KEYS.PREMIUM);
    return data ? JSON.parse(data) : { unlocked: false, purchasedAt: null };
  } catch {
    return { unlocked: false, purchasedAt: null };
  }
}

export async function setPremiumUnlocked(unlocked) {
  const current = await getPremium();
  const next = {
    ...current,
    unlocked: !!unlocked,
    purchasedAt: unlocked ? (current.purchasedAt || new Date().toISOString()) : current.purchasedAt,
  };
  await AsyncStorage.setItem(KEYS.PREMIUM, JSON.stringify(next));
  return next;
}

// ==================== PROGRESS ====================
// { [subjectId]: { answered: { [questionId]: boolean }, currentIndex: number } }
export async function getProgress() {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function saveAnswer(subjectId, questionId, isCorrect) {
  const progress = await getProgress();
  if (!progress[subjectId]) {
    progress[subjectId] = { answered: {}, currentIndex: 0 };
  }
  progress[subjectId].answered[questionId] = isCorrect;
  await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));

  // Update SRS box
  await updateSRSBox(questionId, isCorrect);

  // Update streak
  await recordActivity();

  // Update notification badge
  try {
    const { updateStreakNotification } = require('./notifications');
    updateStreakNotification();
  } catch {}

  return progress;
}

export async function setCurrentIndex(subjectId, index) {
  const progress = await getProgress();
  if (!progress[subjectId]) {
    progress[subjectId] = { answered: {}, currentIndex: 0 };
  }
  progress[subjectId].currentIndex = index;
  await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
}

// ==================== BOOKMARKS ====================
export async function getBookmarks() {
  try {
    const data = await AsyncStorage.getItem(KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function toggleBookmark(questionId) {
  const bookmarks = await getBookmarks();
  const index = bookmarks.indexOf(questionId);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(questionId);
  }
  await AsyncStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  return bookmarks;
}

// ==================== EXAM HISTORY ====================
export async function getExamHistory() {
  try {
    const data = await AsyncStorage.getItem(KEYS.EXAM_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveExamResult(result) {
  const history = await getExamHistory();
  history.unshift(result);
  await AsyncStorage.setItem(KEYS.EXAM_HISTORY, JSON.stringify(history));
  return history;
}

// ==================== SPACED REPETITION (Leitner System) ====================
// SRS: { [questionId]: { box: 0-4, nextReview: timestamp, lastSeen: timestamp } }
// Box 0: New/Wrong → review immediately
// Box 1: Review after 1 day
// Box 2: Review after 3 days
// Box 3: Review after 7 days
// Box 4: Review after 14 days (mastered)
const SRS_INTERVALS = [0, 1, 3, 7, 14]; // days per box

export async function getSRS() {
  try {
    const data = await AsyncStorage.getItem(KEYS.SRS);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export async function updateSRSBox(questionId, isCorrect) {
  const srs = await getSRS();
  const now = Date.now();
  const current = srs[questionId] || { box: 0, nextReview: now, lastSeen: now };

  if (isCorrect) {
    current.box = Math.min(current.box + 1, 4);
  } else {
    current.box = 0; // Back to box 0 on wrong answer
  }

  const daysUntilReview = SRS_INTERVALS[current.box];
  current.nextReview = now + daysUntilReview * 24 * 60 * 60 * 1000;
  current.lastSeen = now;
  srs[questionId] = current;

  await AsyncStorage.setItem(KEYS.SRS, JSON.stringify(srs));
  return srs;
}

export function getDueQuestions(questions, srs) {
  const now = Date.now();
  return questions.filter((q) => {
    const entry = srs[q.id];
    if (!entry) return true; // Never seen = due
    return entry.nextReview <= now;
  });
}

export function getSRSStats(questions, srs) {
  let newCount = 0;
  let learning = 0;
  let reviewing = 0;
  let mastered = 0;

  for (const q of questions) {
    const entry = srs[q.id];
    if (!entry) { newCount++; continue; }
    if (entry.box === 0) learning++;
    else if (entry.box < 4) reviewing++;
    else mastered++;
  }

  return { new: newCount, learning, reviewing, mastered };
}

// ==================== STREAK SYSTEM ====================
// { currentStreak: number, longestStreak: number, lastActiveDate: "YYYY-MM-DD", todayCount: number, dailyGoal: number }
export async function getStreak() {
  try {
    const data = await AsyncStorage.getItem(KEYS.STREAK);
    return data
      ? JSON.parse(data)
      : { currentStreak: 0, longestStreak: 0, lastActiveDate: null, todayCount: 0, dailyGoal: 10 };
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, todayCount: 0, dailyGoal: 10 };
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function recordActivity() {
  const streak = await getStreak();
  const today = getToday();
  const yesterday = getYesterday();

  if (streak.lastActiveDate === today) {
    streak.todayCount++;
  } else if (streak.lastActiveDate === yesterday) {
    streak.currentStreak++;
    streak.todayCount = 1;
    streak.lastActiveDate = today;
  } else {
    // Streak broken or first day
    streak.currentStreak = streak.lastActiveDate ? 1 : 1;
    streak.todayCount = 1;
    streak.lastActiveDate = today;
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
  return streak;
}

export async function setDailyGoal(goal) {
  const streak = await getStreak();
  streak.dailyGoal = goal;
  await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
  return streak;
}

// ==================== SETTINGS ====================
// { examDate: "YYYY-MM-DD" | null, darkMode: boolean, dailyGoal: number }
export async function getSettings() {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : { examDate: null, darkMode: false, dailyGoal: 10 };
  } catch {
    return { examDate: null, darkMode: false, dailyGoal: 10 };
  }
}

export async function saveSettings(settings) {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

// ==================== WEAKNESS ANALYSIS ====================
export function getWeaknessAnalysis(questions, progress) {
  const topicStats = {};

  for (const q of questions) {
    const topic = q.topic || 'Sonstiges';
    if (!topicStats[topic]) {
      topicStats[topic] = { total: 0, answered: 0, correct: 0, wrong: 0 };
    }
    topicStats[topic].total++;

    const answered = progress?.answered?.[q.id];
    if (answered !== undefined) {
      topicStats[topic].answered++;
      if (answered) topicStats[topic].correct++;
      else topicStats[topic].wrong++;
    }
  }

  // Sort by weakness (lowest accuracy first)
  return Object.entries(topicStats)
    .map(([topic, stats]) => ({
      topic,
      ...stats,
      accuracy: stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : -1,
    }))
    .sort((a, b) => {
      if (a.accuracy === -1) return 1;
      if (b.accuracy === -1) return -1;
      return a.accuracy - b.accuracy;
    });
}

// ==================== STATS ====================
export async function getStats() {
  const progress = await getProgress();
  const examHistory = await getExamHistory();
  const streak = await getStreak();
  let totalAnswered = 0;
  let totalCorrect = 0;
  for (const subjectId of Object.keys(progress)) {
    const answered = progress[subjectId]?.answered || {};
    for (const qId of Object.keys(answered)) {
      totalAnswered++;
      if (answered[qId]) totalCorrect++;
    }
  }
  return {
    totalAnswered,
    totalCorrect,
    accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    examsCompleted: examHistory.length,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    todayCount: streak.todayCount,
    dailyGoal: streak.dailyGoal,
  };
}

// ==================== RESET ====================
export async function resetAllData() {
  await AsyncStorage.multiRemove([
    KEYS.PROGRESS,
    KEYS.BOOKMARKS,
    KEYS.EXAM_HISTORY,
    KEYS.STREAK,
    KEYS.SRS,
  ]);
}
