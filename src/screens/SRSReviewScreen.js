import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SUBJECTS, getQuestions } from '../data/subjects';
import { saveAnswer, getBookmarks, toggleBookmark, getSRS, getDueQuestions } from '../utils/storage';
import QuestionCard from '../components/QuestionCard';
import { useTheme } from '../utils/theme';

export default function SRSReviewScreen({ navigation }) {
  const { colors } = useTheme();
  const [dueQuestions, setDueQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [questionSubjects, setQuestionSubjects] = useState({});

  useFocusEffect(useCallback(() => {
    async function load() {
      const srs = await getSRS();
      const bm = await getBookmarks();
      setBookmarks(bm);
      const allDue = [];
      const subjectMap = {};
      for (const subject of SUBJECTS) {
        const due = getDueQuestions(getQuestions(subject.id), srs);
        for (const q of due) { subjectMap[q.id] = subject.id; }
        allDue.push(...due);
      }
      for (let i = allDue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allDue[i], allDue[j]] = [allDue[j], allDue[i]];
      }
      setDueQuestions(allDue);
      setQuestionSubjects(subjectMap);
    }
    load();
  }, []));

  const handleAnswer = async (questionId, isCorrect) => {
    const subjectId = questionSubjects[questionId];
    if (subjectId) await saveAnswer(subjectId, questionId, isCorrect);
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= dueQuestions.length) {
      Alert.alert('Geschafft!', `${dueQuestions.length} Fragen wiederholt.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
      return;
    }
    setCurrentIndex(currentIndex + 1);
  };

  if (dueQuestions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Alles wiederholt</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>Keine Fragen fällig. Das Leitner-System plant deine nächsten Wiederholungen automatisch.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.bar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.barTitle, { color: colors.text }]}>Wiederholung</Text>
        <Text style={[styles.barCount, { color: colors.textSecondary }]}>{dueQuestions.length - currentIndex} übrig</Text>
      </View>
      <QuestionCard
        question={dueQuestions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={dueQuestions.length}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onBookmark={(qid) => toggleBookmark(qid).then(setBookmarks)}
        isBookmarked={bookmarks.includes(dueQuestions[currentIndex]?.id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  bar: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barTitle: { fontSize: 17, fontWeight: '700' },
  barCount: { fontSize: 14 },
});
