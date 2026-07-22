import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Platform, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getQuestions, getSubject, DEMO_QUESTION_LIMIT } from '../data/subjects';
import {
  saveAnswer,
  setCurrentIndex,
  getBookmarks,
  toggleBookmark,
  getProgress,
  getStreak,
} from '../utils/storage';
import QuestionCard from '../components/QuestionCard';
import StreakCelebration from '../components/StreakCelebration';
import { useTheme } from '../utils/theme';
import { usePremium } from '../contexts/PremiumContext';

export default function LearnScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { isPremium } = usePremium();
  const { subjectId, startIndex = 0, filterMode, filterTopic } = route.params;
  const subject = getSubject(subjectId);
  const allQuestions = getQuestions(subjectId);

  const [progress, setProgress] = useState({ answered: {} });
  const [bookmarks, setBookmarks] = useState([]);
  const [currentIndex, setIndex] = useState(0);
  const [celebration, setCelebration] = useState({ visible: false, streak: 0 });

  const isLocked = !!(subject?.isPremium && !isPremium);

  // Filter questions based on mode (then optionally cap to demo limit)
  const questions = useMemo(() => {
    let filtered;
    if (filterMode === 'wrong') {
      filtered = allQuestions.filter((q) => progress.answered[q.id] === false);
    } else if (filterMode === 'topic' && filterTopic) {
      filtered = allQuestions.filter((q) => q.topic === filterTopic);
    } else {
      filtered = allQuestions;
    }
    // Cap to demo questions when subject is locked
    if (isLocked) {
      return filtered.slice(0, DEMO_QUESTION_LIMIT);
    }
    return filtered;
  }, [filterMode, filterTopic, allQuestions, progress.answered, isLocked]);

  useFocusEffect(
    useCallback(() => {
      getBookmarks().then(setBookmarks);
      getProgress().then((p) => {
        setProgress(p[subjectId] || { answered: {}, currentIndex: 0 });
        // Set start index for normal mode
        if (!filterMode) {
          setIndex(startIndex);
        }
      });
    }, [subjectId])
  );

  const handleAnswer = async (questionId, isCorrect) => {
    await saveAnswer(subjectId, questionId, isCorrect);
    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        const Haptics = require('expo-haptics');
        if (isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch {}
    }
    // Check if daily goal was just reached for the first time today
    try {
      const streak = await getStreak();
      const prevCount = streak.todayCount - 1; // saveAnswer already incremented
      if (prevCount < streak.dailyGoal && streak.todayCount >= streak.dailyGoal) {
        setCelebration({ visible: true, streak: streak.currentStreak });
      }
    } catch {}
  };

  const handleNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // Locked subject: end of demo → suggest unlocking premium
      if (isLocked) {
        Alert.alert(
          'Demo abgeschlossen',
          `Du hast alle ${DEMO_QUESTION_LIMIT} Demo-Fragen durchgearbeitet. Schalte das Fach frei, um alle ${allQuestions.length} Fragen zu lernen.`,
          [
            { text: 'Später', style: 'cancel', onPress: () => navigation.goBack() },
            { text: 'Freischalten', onPress: () => navigation.replace('Paywall') },
          ]
        );
        return;
      }
      const title = filterMode === 'wrong'
        ? 'Alle Fehler wiederholt!'
        : filterMode === 'topic'
        ? `${filterTopic} abgeschlossen!`
        : 'Geschafft!';
      Alert.alert(
        title,
        `Du hast alle ${questions.length} Fragen durchgearbeitet!`,
        [{ text: 'Zurück', onPress: () => navigation.goBack() }]
      );
      return;
    }
    setIndex(nextIndex);
    if (!filterMode) {
      await setCurrentIndex(subjectId, nextIndex);
    }
  };

  const handleBookmark = async (questionId) => {
    const updated = await toggleBookmark(questionId);
    setBookmarks(updated);
  };

  if (questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyText}>
            {filterMode === 'wrong'
              ? 'Keine falschen Fragen! Alles richtig gemacht.'
              : 'Keine Fragen verfügbar.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!questions[currentIndex]) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyText}>Laden...</Text>
      </SafeAreaView>
    );
  }

  // Header label
  const modeLabel = filterMode === 'wrong'
    ? '🔄 Fehler wiederholen'
    : filterMode === 'topic'
    ? `📂 ${filterTopic}`
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StreakCelebration
        visible={celebration.visible}
        streak={celebration.streak}
        onDismiss={() => setCelebration({ visible: false, streak: 0 })}
      />
      {isLocked && (
        <TouchableOpacity
          style={styles.demoBadge}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Paywall')}
        >
          <Ionicons name="lock-closed" size={14} color="#1A2970" style={{ marginRight: 6 }} />
          <Text style={styles.demoBadgeText}>
            Demo · Frage {currentIndex + 1} von {DEMO_QUESTION_LIMIT}  ·  Freischalten
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#1A2970" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}
      {modeLabel && !isLocked && (
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>{modeLabel}</Text>
        </View>
      )}
      <QuestionCard
        question={questions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onBookmark={handleBookmark}
        isBookmarked={bookmarks.includes(questions[currentIndex].id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#8E8E93', textAlign: 'center' },
  modeBadge: {
    backgroundColor: '#FF9500',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  modeBadgeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  demoBadge: {
    backgroundColor: '#FFC33C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBadgeText: { color: '#1A2970', fontWeight: '700', fontSize: 13 },
});
