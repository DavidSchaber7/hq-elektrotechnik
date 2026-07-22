import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getQuestions, getSubject } from '../data/subjects';
import {
  saveAnswer,
  saveExamResult,
  getBookmarks,
  toggleBookmark,
} from '../utils/storage';
import ExamQuestionCard from '../components/ExamQuestionCard';
import { useTheme } from '../utils/theme';

const EXAM_COUNT = 30;
const EXAM_TIME_MINUTES = 45;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ExamScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const subject = getSubject(subjectId);
  const { colors, dark } = useTheme();
  const allQuestions = getQuestions(subjectId);

  const examQuestions = useMemo(
    () => shuffleArray(allQuestions).slice(0, EXAM_COUNT),
    [subjectId]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME_MINUTES * 60);
  const timerRef = useRef(null);
  const finishedRef = useRef(false);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!finishedRef.current) {
            finishedRef.current = true;
            setTimeout(() => finishExam(true), 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useFocusEffect(
    useCallback(() => {
      getBookmarks().then(setBookmarks);
    }, [])
  );

  const handleAnswer = (questionId, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  };

  const handleNext = () => {
    if (currentIndex + 1 >= examQuestions.length) {
      confirmFinish();
      return;
    }
    setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const confirmFinish = () => {
    const unanswered = examQuestions.length - Object.keys(answers).length;
    if (unanswered > 0) {
      Alert.alert(
        'Prüfung abgeben?',
        `Du hast noch ${unanswered} unbeantwortete Frage${unanswered > 1 ? 'n' : ''}. Trotzdem auswerten?`,
        [
          { text: 'Weiter lernen', style: 'cancel' },
          { text: 'Auswerten', style: 'destructive', onPress: () => finishExam(false) },
        ]
      );
    } else {
      finishExam(false);
    }
  };

  const finishExam = async (timeUp) => {
    clearInterval(timerRef.current);
    finishedRef.current = true;

    const answerResults = {};
    for (const q of examQuestions) {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct;
      answerResults[q.id] = isCorrect;
      if (userAnswer !== undefined) {
        await saveAnswer(subjectId, q.id, isCorrect);
      }
    }

    const correct = examQuestions.filter((q) => answers[q.id] === q.correct).length;
    const timeUsed = EXAM_TIME_MINUTES * 60 - timeLeft;

    await saveExamResult({
      subjectId,
      date: new Date().toISOString(),
      score: correct,
      total: examQuestions.length,
      answers: answerResults,
      timeUsed,
      timeUp,
    });

    navigation.replace('ExamResult', {
      questions: examQuestions,
      answers,
      subjectId,
      timeUsed,
      timeUp,
    });
  };

  const handleBookmark = async (questionId) => {
    const updated = await toggleBookmark(questionId);
    setBookmarks(updated);
  };

  const currentQuestion = examQuestions[currentIndex];
  if (!currentQuestion) return null;

  const answeredCount = Object.keys(answers).length;
  const isLast = currentIndex + 1 >= examQuestions.length;
  const timeWarning = timeLeft < 300; // < 5 min
  const timeCritical = timeLeft < 60; // < 1 min

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Exam header with timer */}
      <View style={[styles.examHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.examHeaderLeft}>
          <Text style={[styles.examBadgeText, { color: colors.text }]}>Prüfung</Text>
          <Text style={[styles.examProgress, { color: colors.textSecondary }]}>{answeredCount}/{examQuestions.length}</Text>
        </View>
        <View style={[
          styles.timerBadge,
          { backgroundColor: dark ? '#253840' : '#F0F0F0' },
          timeWarning && { backgroundColor: '#FF960020' },
          timeCritical && { backgroundColor: '#FF4B4B20' },
        ]}>
          <Text style={[
            styles.timerText,
            { color: colors.text },
            timeWarning && { color: colors.streakOrange },
            timeCritical && { color: colors.wrongRed },
          ]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Progress dots */}
      <View style={[styles.progressDotsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {examQuestions.map((q, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.progressDot,
              answers[q.id] !== undefined && styles.progressDotAnswered,
              i === currentIndex && styles.progressDotCurrent,
            ]}
            onPress={() => setCurrentIndex(i)}
            activeOpacity={0.7}
          />
        ))}
      </View>

      <ExamQuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={examQuestions.length}
        onAnswer={handleAnswer}
        onBookmark={handleBookmark}
        isBookmarked={bookmarks.includes(currentQuestion.id)}
        selectedAnswer={answers[currentQuestion.id]}
      />

      {/* Navigation */}
      <View style={[styles.navBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
            ← Zurück
          </Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            style={[styles.navButton, styles.finishButton]}
            onPress={confirmFinish}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>Auswerten ✓</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.nextButtonText}>Weiter →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  examHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  examHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  examBadgeText: { fontWeight: '700', fontSize: 16 },
  examProgress: { fontSize: 13, marginLeft: 8 },
  timerBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timerText: { fontWeight: '800', fontSize: 17 },
  progressDotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    paddingBottom: 4,
    gap: 4,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
  progressDotAnswered: { backgroundColor: '#34C759' },
  progressDotCurrent: { backgroundColor: '#007AFF', width: 12, height: 8, borderRadius: 4 },
  navBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  navButtonDisabled: { opacity: 0.4 },
  navButtonText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  navButtonTextDisabled: { color: '#8E8E93' },
  nextButton: { backgroundColor: '#4A90D9' },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  finishButton: { backgroundColor: '#58CC02' },
  finishButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
