import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Share } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { useTheme } from '../utils/theme';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function ExamResultScreen({ route, navigation }) {
  const { colors, dark } = useTheme();
  const { questions, answers, subjectId, timeUsed, timeUp } = route.params;
  const total = questions.length;
  const correctCount = questions.filter((q) => answers[q.id] === q.correct).length;
  const wrongCount = total - correctCount;
  const percent = Math.round((correctCount / total) * 100);
  const passed = percent >= 50;
  const reviewRequested = useRef(false);

  useEffect(() => {
    if (percent >= 70 && !reviewRequested.current) {
      reviewRequested.current = true;
      setTimeout(async () => {
        try { if (await StoreReview.hasAction()) await StoreReview.requestReview(); } catch {}
      }, 2000);
    }
  }, []);

  const timeStr = timeUsed ? `${Math.floor(timeUsed / 60)}:${(timeUsed % 60).toString().padStart(2, '0')}` : null;

  const handleShare = async () => {
    try { await Share.share({
      message: `HQ Prüfung Elektrotechnik: ${subjectId.toUpperCase()}\n${correctCount}/${total} richtig (${percent}%)${timeStr ? ` in ${timeStr}` : ''}\n${passed ? 'Bestanden!' : 'Weiter lernen!'}`,
    }); } catch {}
  };

  const card = [styles.card, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#ECECEC' }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Result Header */}
        <View style={[styles.resultCard, { backgroundColor: passed ? colors.correctGreen + '10' : colors.wrongRed + '10', borderColor: passed ? colors.correctGreen + '30' : colors.wrongRed + '30' }]}>
          <Text style={[styles.resultPercent, { color: passed ? colors.correctGreen : colors.wrongRed }]}>{percent}%</Text>
          <Text style={[styles.resultTitle, { color: colors.text }]}>{passed ? 'Bestanden' : 'Nicht bestanden'}</Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary }]}>
            {correctCount} richtig · {wrongCount} falsch{timeStr ? ` · ${timeStr}` : ''}
            {timeUp ? ' (Zeit abgelaufen)' : ''}
          </Text>

          <View style={styles.resultActions}>
            <TouchableOpacity style={[styles.resultBtn, { backgroundColor: colors.card, borderColor: dark ? colors.border : '#E0E0E0' }]} onPress={handleShare}>
              <Text style={[styles.resultBtnText, { color: colors.info }]}>Teilen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resultBtn, { backgroundColor: colors.brand }]} onPress={() => navigation.popToTop()}>
              <Text style={[styles.resultBtnText, { color: '#fff' }]}>Fertig</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Questions */}
        <Text style={[styles.section, { color: colors.textSecondary }]}>Alle Fragen</Text>
        {questions.map((q, index) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correct;

          return (
            <View key={q.id} style={[card, { borderLeftWidth: 3, borderLeftColor: isCorrect ? colors.correctGreen : colors.wrongRed }]}>
              <View style={styles.qHeader}>
                <Text style={[styles.qNumber, { color: colors.textSecondary }]}>Frage {index + 1}</Text>
                <Text style={[styles.qBadge, { color: isCorrect ? colors.correctGreen : colors.wrongRed }]}>
                  {isCorrect ? 'Richtig' : 'Falsch'}
                </Text>
              </View>
              <Text style={[styles.qText, { color: colors.text }]}>{q.text}</Text>

              {q.options.map((option, optIdx) => {
                const isUserChoice = userAnswer === optIdx;
                const isCorrectOpt = q.correct === optIdx;
                let textColor = colors.textSecondary;
                let fontWeight = '400';
                let prefix = '';

                if (isCorrectOpt) { textColor = colors.correctGreen; fontWeight = '600'; prefix = '✓ '; }
                else if (isUserChoice) { textColor = colors.wrongRed; fontWeight = '600'; prefix = '✗ '; }

                return (
                  <Text key={optIdx} style={[styles.qOption, { color: textColor, fontWeight }]}>
                    {prefix}{OPTION_LABELS[optIdx]}) {option}
                  </Text>
                );
              })}

              {!isCorrect && q.explanation && (
                <View style={[styles.explanation, { backgroundColor: dark ? '#253840' : '#F8F8F8' }]}>
                  <Text style={[styles.explanationText, { color: colors.textTertiary }]}>{q.explanation}</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  resultCard: { borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, marginBottom: 8 },
  resultPercent: { fontSize: 56, fontWeight: '800' },
  resultTitle: { fontSize: 22, fontWeight: '700', marginTop: 4 },
  resultSub: { fontSize: 14, marginTop: 6 },
  resultActions: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  resultBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  resultBtnText: { fontSize: 16, fontWeight: '700' },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  card: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1 },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  qNumber: { fontSize: 12, fontWeight: '700' },
  qBadge: { fontSize: 12, fontWeight: '700' },
  qText: { fontSize: 15, fontWeight: '600', lineHeight: 21, marginBottom: 8 },
  qOption: { fontSize: 13, lineHeight: 20, paddingVertical: 2 },
  explanation: { marginTop: 10, padding: 10, borderRadius: 8 },
  explanationText: { fontSize: 13, lineHeight: 19 },
});
