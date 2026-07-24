import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, TextInput, Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStats, getExamHistory, getSettings, saveSettings, resetAllData } from '../utils/storage';
import { useTheme } from '../utils/theme';
import { toggleNotifications, scheduleExamReminders } from '../utils/notifications';

export default function SettingsScreen() {
  const { dark, colors, toggle: toggleDarkMode } = useTheme();
  const [stats, setStats] = useState({
    totalAnswered: 0, totalCorrect: 0, accuracy: 0,
    examsCompleted: 0, currentStreak: 0, longestStreak: 0,
    todayCount: 0, dailyGoal: 10,
  });
  const [examHistory, setExamHistory] = useState([]);
  const [settings, setSettingsState] = useState({ examDate: null, dailyGoal: 10 });
  const [showDateInput, setShowDateInput] = useState(false);
  const [dateInput, setDateInput] = useState('');

  useFocusEffect(useCallback(() => {
    getStats().then(setStats);
    getExamHistory().then(setExamHistory);
    getSettings().then(setSettingsState);
  }, []));

  const handleReset = () => {
    Alert.alert('Fortschritt zurücksetzen?',
      'Alle Daten werden gelöscht. Dies kann nicht rückgängig gemacht werden.',
      [{ text: 'Abbrechen', style: 'cancel' },
       { text: 'Zurücksetzen', style: 'destructive', onPress: async () => {
         await resetAllData();
         setStats({ totalAnswered: 0, totalCorrect: 0, accuracy: 0, examsCompleted: 0, currentStreak: 0, longestStreak: 0, todayCount: 0, dailyGoal: 10 });
         setExamHistory([]);
       }}]);
  };

  const handleSetExamDate = async () => {
    let parsed = dateInput;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateInput)) {
      const [d, m, y] = dateInput.split('.');
      parsed = `${y}-${m}-${d}`;
    }
    const date = new Date(parsed);
    if (isNaN(date.getTime())) { Alert.alert('Ungültiges Datum', 'Format: TT.MM.JJJJ'); return; }
    await saveSettings({ examDate: parsed });
    setSettingsState((p) => ({ ...p, examDate: parsed }));
    setShowDateInput(false);
    scheduleExamReminders(parsed).catch(() => {});
  };

  const handleSetDailyGoal = (goal) => {
    saveSettings({ dailyGoal: goal });
    setSettingsState((p) => ({ ...p, dailyGoal: goal }));
    setStats((p) => ({ ...p, dailyGoal: goal }));
  };

  const handleShare = async () => {
    try { await Share.share({
      message: `HQ Prüfung Elektrotechnik\n${stats.currentStreak} Tage Streak\n${stats.totalAnswered} Fragen beantwortet\n${stats.accuracy}% Erfolgsquote`,
    }); } catch {}
  };

  const daysUntilExam = settings.examDate
    ? Math.max(0, Math.ceil((new Date(settings.examDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const card = [styles.card, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Statistik</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streak */}
        <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]}>
          <View style={styles.streakRow}>
            <View>
              <Text style={[styles.streakNumber, { color: colors.streakOrange }]}>{stats.currentStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.text }]}>Tage Streak</Text>
            </View>
            <View style={styles.streakRight}>
              <Text style={[styles.streakRecord, { color: colors.textSecondary }]}>Rekord: {stats.longestStreak}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <Text style={[styles.section, { color: colors.textSecondary }]}>Übersicht</Text>
        <View style={card}>
          {[
            { l: 'Fragen beantwortet', v: `${stats.totalAnswered} / 600` },
            { l: 'Davon richtig', v: stats.totalCorrect, c: colors.correctGreen },
            { l: 'Erfolgsquote', v: `${stats.accuracy}%`, c: colors.info },
            { l: 'Prüfungen', v: stats.examsCompleted },
            { l: 'Heute gelernt', v: `${stats.todayCount} Fragen`, last: true },
          ].map((r) => (
            <View key={r.l} style={[styles.row, !r.last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{r.l}</Text>
              <Text style={[styles.rowValue, { color: r.c || colors.text }]}>{r.v}</Text>
            </View>
          ))}
        </View>

        {/* Exam Date */}
        <Text style={[styles.section, { color: colors.textSecondary }]}>Prüfungstermin</Text>
        <View style={card}>
          {settings.examDate ? (
            <View style={styles.row}>
              <View>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {new Date(settings.examDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                {daysUntilExam !== null && <Text style={{ fontSize: 13, color: colors.wrongRed, fontWeight: '700', marginTop: 2 }}>Noch {daysUntilExam} Tage</Text>}
              </View>
              <TouchableOpacity onPress={async () => { await saveSettings({ examDate: null }); setSettingsState((p) => ({ ...p, examDate: null })); }}>
                <Text style={{ fontSize: 14, color: colors.wrongRed, fontWeight: '600' }}>Entfernen</Text>
              </TouchableOpacity>
            </View>
          ) : showDateInput ? (
            <View style={[styles.row, { gap: 10 }]}>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
                placeholder="TT.MM.JJJJ" placeholderTextColor={colors.textSecondary}
                value={dateInput} onChangeText={setDateInput} keyboardType="numbers-and-punctuation" maxLength={10} />
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.brand }]} onPress={handleSetExamDate}>
                <Text style={styles.smallBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.row} onPress={() => setShowDateInput(true)}>
              <Text style={[styles.rowLabel, { color: colors.info }]}>Termin festlegen</Text>
              <Text style={{ color: colors.info }}>→</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Daily Goal */}
        <Text style={[styles.section, { color: colors.textSecondary }]}>Tägliches Lernziel</Text>
        <View style={styles.goalRow}>
          {[5, 10, 20, 30, 50].map((goal) => (
            <TouchableOpacity key={goal}
              style={[styles.goalChip, { backgroundColor: (settings.dailyGoal || 10) === goal ? colors.brand : colors.card,
                borderColor: (settings.dailyGoal || 10) === goal ? colors.brand : (dark ? colors.border : '#ECECEC') }]}
              onPress={() => handleSetDailyGoal(goal)}>
              <Text style={[styles.goalText, { color: (settings.dailyGoal || 10) === goal ? '#fff' : colors.text }]}>{goal}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exam History */}
        {examHistory.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.textSecondary }]}>Prüfungshistorie</Text>
            <View style={card}>
              {examHistory.slice(0, 10).map((exam, i) => {
                const pct = Math.round((exam.score / exam.total) * 100);
                return (
                  <View key={i} style={[styles.row, i < Math.min(examHistory.length, 10) - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>
                      {exam.subjectId.toUpperCase()} · {new Date(exam.date).toLocaleDateString('de-DE')}
                    </Text>
                    <Text style={[styles.rowValue, { color: pct >= 50 ? colors.correctGreen : colors.wrongRed }]}>
                      {exam.score}/{exam.total}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Settings */}
        <Text style={[styles.section, { color: colors.textSecondary }]}>Einstellungen</Text>
        <View style={card}>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]} onPress={toggleDarkMode} activeOpacity={0.7}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
            <View style={[styles.toggle, { backgroundColor: dark ? colors.brand : '#E5E5E5' }]}>
              <View style={[styles.toggleThumb, dark && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={async () => {
            const enabled = !(settings.notificationsEnabled !== false);
            const result = await toggleNotifications(enabled);
            setSettingsState((p) => ({ ...p, notificationsEnabled: result || enabled }));
            if (!result && enabled) Alert.alert('Benachrichtigungen', 'Bitte erlaube Benachrichtigungen in den Geräte-Einstellungen.');
          }} activeOpacity={0.7}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Erinnerungen</Text>
            <View style={[styles.toggle, { backgroundColor: settings.notificationsEnabled !== false ? colors.brand : '#E5E5E5' }]}>
              <View style={[styles.toggleThumb, settings.notificationsEnabled !== false && styles.toggleThumbOn]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]} onPress={handleShare}>
            <Text style={[styles.actionText, { color: colors.info }]}>Teilen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]} onPress={handleReset}>
            <Text style={[styles.actionText, { color: colors.wrongRed }]}>Zurücksetzen</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: colors.textSecondary }]}>HQ Prüfung Elektrotechnik v1.0 · 600 Fragen · 3 Fächer</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  content: { padding: 16, paddingBottom: 40 },
  streakCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakNumber: { fontSize: 42, fontWeight: '800' },
  streakLabel: { fontSize: 16, fontWeight: '600' },
  streakRight: { alignItems: 'flex-end' },
  streakRecord: { fontSize: 13 },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 22, marginBottom: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 15, fontWeight: '700' },
  input: { flex: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  smallBtn: { borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  goalRow: { flexDirection: 'row', gap: 8 },
  goalChip: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1 },
  goalText: { fontSize: 16, fontWeight: '700' },
  toggle: { width: 48, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2 },
  toggleThumbOn: { alignSelf: 'flex-end' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  actionBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  actionText: { fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', marginTop: 30, fontSize: 12 },
});
