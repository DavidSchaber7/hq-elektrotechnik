import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECTS, getQuestions, DEMO_QUESTION_LIMIT } from '../data/subjects';
import { getProgress, getStreak, getSettings } from '../utils/storage';
import { useTheme } from '../utils/theme';
import { usePremium } from '../contexts/PremiumContext';

const SUBJECT_COLORS = { technik: '#4A90D9', organisation: '#27AE60', fuehrung: '#F39C12' };

export default function HomeScreen({ navigation }) {
  const { colors, dark } = useTheme();
  const { isPremium, priceLabel } = usePremium();
  const [progress, setProgress] = useState({});
  const [streak, setStreak] = useState({ currentStreak: 0, todayCount: 0, dailyGoal: 10 });
  const [settings, setSettings] = useState({ examDate: null });

  useFocusEffect(useCallback(() => {
    getProgress().then(setProgress);
    getStreak().then(setStreak);
    getSettings().then(setSettings);
  }, []));

  let totalAnswered = 0;
  let totalCorrect = 0;
  for (const s of SUBJECTS) {
    const sp = progress[s.id]?.answered || {};
    totalAnswered += Object.keys(sp).length;
    totalCorrect += Object.values(sp).filter(Boolean).length;
  }
  const totalPercent = Math.round((totalAnswered / 600) * 100);

  const daysUntilExam = settings.examDate
    ? Math.max(0, Math.ceil((new Date(settings.examDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>HQ Prüfung Elektrotechnik</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {totalAnswered > 0 ? `${totalAnswered} von 600 Fragen bearbeitet` : 'Industriemeister Elektrotechnik – Handlungsspezifische Qualifikation'}
            </Text>
          </View>
          {streak.currentStreak > 0 && (
            <View style={[styles.streakPill, { backgroundColor: colors.streakOrange }]}>
              <Text style={styles.streakText}>{streak.currentStreak}</Text>
            </View>
          )}
        </View>

        {/* Overall Progress */}
        {totalAnswered > 0 && (
          <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]}>
            <View style={styles.overallRow}>
              <View>
                <Text style={[styles.overallPercent, { color: colors.brand }]}>{totalPercent}%</Text>
                <Text style={[styles.overallLabel, { color: colors.textSecondary }]}>Gesamtfortschritt</Text>
              </View>
              <View style={styles.overallStats}>
                <View style={styles.overallStat}>
                  <Text style={[styles.overallStatNum, { color: colors.correctGreen }]}>{totalCorrect}</Text>
                  <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>richtig</Text>
                </View>
                <View style={styles.overallStat}>
                  <Text style={[styles.overallStatNum, { color: colors.wrongRed }]}>{totalAnswered - totalCorrect}</Text>
                  <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>falsch</Text>
                </View>
              </View>
            </View>
            <View style={[styles.overallTrack, { backgroundColor: dark ? '#253840' : '#F0F0F0' }]}>
              <View style={[styles.overallFill, { width: `${Math.max(totalPercent, 1)}%`, backgroundColor: colors.brand }]} />
            </View>
            {/* Daily goal */}
            <View style={styles.dailyRow}>
              <Text style={[styles.dailyLabel, { color: colors.textSecondary }]}>Heute</Text>
              <View style={[styles.dailyTrack, { backgroundColor: dark ? '#253840' : '#F0F0F0' }]}>
                <View style={[styles.dailyFill, { width: `${Math.min(100, (streak.todayCount / streak.dailyGoal) * 100)}%`, backgroundColor: colors.gold }]} />
              </View>
              <Text style={[styles.dailyCount, { color: colors.textSecondary }]}>{streak.todayCount}/{streak.dailyGoal}</Text>
            </View>
          </View>
        )}

        {/* Exam countdown */}
        {daysUntilExam !== null && (
          <View style={[styles.examBanner, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]}>
            <Text style={[styles.examDays, { color: colors.wrongRed }]}>{daysUntilExam}</Text>
            <Text style={[styles.examLabel, { color: colors.textSecondary }]}>Tage bis zur Prüfung</Text>
          </View>
        )}

        {/* Premium upsell banner — only when not yet purchased */}
        {!isPremium && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.premiumBanner}
            onPress={() => navigation.navigate('Paywall')}
          >
            <View style={styles.premiumBannerInner}>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={20} color="#1A2970" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>Alle Fächer freischalten</Text>
                <Text style={styles.premiumSubtitle}>
                  3 Fächer + 540 weitere Fragen für {priceLabel} – einmalig.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#1A2970" />
            </View>
          </TouchableOpacity>
        )}

        {/* Section label */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Fächer</Text>

        {/* Subject Cards */}
        {SUBJECTS.map((subject) => {
          const subColor = SUBJECT_COLORS[subject.id];
          const questions = getQuestions(subject.id);
          const sp = progress[subject.id]?.answered || {};
          const answered = Object.keys(sp).length;
          const correct = Object.values(sp).filter(Boolean).length;
          const percent = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0;

          const locked = subject.isPremium && !isPremium;
          const visibleCount = locked ? DEMO_QUESTION_LIMIT : questions.length;

          return (
            <TouchableOpacity
              key={subject.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }]}
              onPress={() => navigation.navigate('Subject', { subjectId: subject.id })}
              activeOpacity={0.65}
            >
              {/* Color accent bar */}
              <View style={[styles.accentBar, { backgroundColor: subColor }]} />
              <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardNameRow}>
                    <Text style={[styles.cardName, { color: colors.text }]}>{subject.name}</Text>
                    {locked && (
                      <View style={[styles.lockBadge, { backgroundColor: colors.gold || '#FFC33C' }]}>
                        <Ionicons name="lock-closed" size={11} color="#1A2970" />
                        <Text style={styles.lockBadgeText}>Demo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                    {locked
                      ? `${visibleCount} Demo-Fragen · ${questions.length - visibleCount} weitere mit Premium`
                      : answered > 0
                        ? `${answered} von ${questions.length} · ${correct} richtig`
                        : `${questions.length} Fragen`}
                  </Text>
                  {/* Progress bar */}
                  <View style={[styles.cardTrack, { backgroundColor: dark ? '#253840' : '#F0F0F0' }]}>
                    <View style={[styles.cardFill, { width: `${Math.max(percent, 0.5)}%`, backgroundColor: subColor }]} />
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {locked ? (
                    <Ionicons name="lock-closed" size={22} color={colors.textSecondary} />
                  ) : (
                    <Text style={[styles.cardPercent, { color: percent > 0 ? subColor : colors.textSecondary }]}>{percent}%</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  streakPill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, minWidth: 36, alignItems: 'center', flexShrink: 0 },
  streakText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  overallCard: { marginHorizontal: 16, borderRadius: 16, padding: 18, borderWidth: 1, marginBottom: 8 },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  overallPercent: { fontSize: 36, fontWeight: '800' },
  overallLabel: { fontSize: 13, marginTop: 2 },
  overallStats: { flexDirection: 'row', gap: 20, marginTop: 4 },
  overallStat: { alignItems: 'center' },
  overallStatNum: { fontSize: 20, fontWeight: '800' },
  overallStatLabel: { fontSize: 11, marginTop: 1 },
  overallTrack: { height: 8, borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  overallFill: { height: '100%', borderRadius: 4 },
  dailyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  dailyLabel: { fontSize: 12, fontWeight: '600', marginRight: 10, minWidth: 38 },
  dailyTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', marginRight: 8 },
  dailyFill: { height: '100%', borderRadius: 3 },
  dailyCount: { fontSize: 12, fontWeight: '700', minWidth: 32 },

  examBanner: { marginHorizontal: 16, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 8, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  examDays: { fontSize: 28, fontWeight: '800' },
  examLabel: { fontSize: 14 },

  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 20, marginTop: 18, marginBottom: 10 },

  card: { marginHorizontal: 16, borderRadius: 14, marginBottom: 8, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  accentBar: { width: 4 },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  cardName: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  cardSub: { fontSize: 13, marginTop: 3 },
  cardTrack: { height: 5, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  cardFill: { height: '100%', borderRadius: 3 },
  cardRight: { marginLeft: 16, alignItems: 'center', minWidth: 44 },
  cardPercent: { fontSize: 22, fontWeight: '800' },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  lockBadgeText: { fontSize: 11, fontWeight: '800', color: '#1A2970', letterSpacing: 0.3 },

  premiumBanner: { marginHorizontal: 16, marginTop: 4, marginBottom: 4, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFC33C' },
  premiumBannerInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  premiumBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(26, 41, 112, 0.12)', alignItems: 'center', justifyContent: 'center' },
  premiumTitle: { fontSize: 15, fontWeight: '800', color: '#1A2970' },
  premiumSubtitle: { fontSize: 12, color: '#1A2970', opacity: 0.75, marginTop: 2 },
});
