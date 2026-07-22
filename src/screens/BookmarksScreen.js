import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SUBJECTS, getQuestions } from '../data/subjects';
import { getBookmarks, toggleBookmark, saveAnswer } from '../utils/storage';
import QuestionCard from '../components/QuestionCard';
import { useTheme } from '../utils/theme';

export default function BookmarksScreen() {
  const { colors, dark } = useTheme();
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [questionSubjects, setQuestionSubjects] = useState({});

  useFocusEffect(useCallback(() => {
    loadBookmarks();
    setQuizMode(false);
    setQuizIndex(0);
  }, []));

  const loadBookmarks = async () => {
    const bm = await getBookmarks();
    setBookmarks(bm);
    const all = [];
    const map = {};
    for (const s of SUBJECTS) {
      for (const q of getQuestions(s.id)) {
        if (bm.includes(q.id)) { all.push({ ...q, subject: s }); map[q.id] = s.id; }
      }
    }
    setBookmarkedQuestions(all);
    setQuestionSubjects(map);
  };

  const handleRemove = async (qid) => {
    await toggleBookmark(qid);
    setBookmarks((b) => b.filter((id) => id !== qid));
    setBookmarkedQuestions((q) => q.filter((x) => x.id !== qid));
  };

  if (quizMode && bookmarkedQuestions.length > 0) {
    const q = bookmarkedQuestions[quizIndex];
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.quizBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.quizBarText, { color: colors.text }]}>Merkliste üben</Text>
          <Text style={[styles.quizBarCount, { color: colors.textSecondary }]}>{quizIndex + 1}/{bookmarkedQuestions.length}</Text>
        </View>
        <QuestionCard
          question={q}
          questionNumber={quizIndex + 1}
          totalQuestions={bookmarkedQuestions.length}
          onAnswer={async (qid, ok) => { const sid = questionSubjects[qid]; if (sid) await saveAnswer(sid, qid, ok); }}
          onNext={() => {
            if (quizIndex + 1 >= bookmarkedQuestions.length) {
              Alert.alert('Geschafft!', 'Alle gemerkten Fragen durchgearbeitet.', [{ text: 'OK', onPress: () => setQuizMode(false) }]);
            } else setQuizIndex(quizIndex + 1);
          }}
          onBookmark={(qid) => toggleBookmark(qid).then(setBookmarks)}
          isBookmarked={bookmarks.includes(q.id)}
        />
      </SafeAreaView>
    );
  }

  const card = [styles.card, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Merkliste</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{bookmarkedQuestions.length} Fragen</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {bookmarkedQuestions.length > 0 && (
          <TouchableOpacity style={[styles.quizBtn, { backgroundColor: colors.brand }]}
            onPress={() => { setQuizIndex(0); setQuizMode(true); }} activeOpacity={0.8}>
            <Text style={styles.quizBtnTitle}>Merkliste üben</Text>
            <Text style={styles.quizBtnArrow}>→</Text>
          </TouchableOpacity>
        )}

        {bookmarkedQuestions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Keine Fragen gemerkt</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Tippe beim Lernen auf das Lesezeichen, um Fragen hier zu speichern.
            </Text>
          </View>
        ) : (
          bookmarkedQuestions.map((q) => (
            <View key={q.id} style={card}>
              <View style={styles.cardTop}>
                <Text style={[styles.cardSubject, { color: colors.textSecondary }]}>{q.subject.id.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => handleRemove(q.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ fontSize: 13, color: colors.wrongRed, fontWeight: '600' }}>Entfernen</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardText, { color: colors.text }]} numberOfLines={2}>{q.text}</Text>
              <Text style={[styles.cardAnswer, { color: colors.correctGreen }]}>
                {['A', 'B', 'C', 'D'][q.correct]}) {q.options[q.correct]}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, marginTop: 4 },
  quizBar: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between' },
  quizBarText: { fontSize: 17, fontWeight: '700' },
  quizBarCount: { fontSize: 15 },
  list: { padding: 16, paddingBottom: 32 },
  quizBtn: { borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  quizBtnTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  quizBtnArrow: { fontSize: 20, color: 'rgba(255,255,255,0.5)' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyDesc: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardSubject: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cardText: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  cardAnswer: { fontSize: 13, fontWeight: '600', marginTop: 8 },
});
