import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useTheme } from '../utils/theme';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const CORRECT_MESSAGES = [
  'Richtig! 🎯', 'Perfekt! ⭐', 'Sehr gut! 💪',
  'Genau richtig! ✨', 'Weiter so! 🔥', 'Klasse! 👏',
];
const WRONG_MESSAGES = [
  'Nicht aufgeben!', 'Beim nächsten Mal!', 'Merke dir das!',
  'Fast! Weiter lernen.', 'Das kommt noch!', 'Kopf hoch – weitermachen!',
];
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function QuestionCard({
  question, questionNumber, totalQuestions, onAnswer, onNext, onBookmark, isBookmarked,
}) {
  const { colors, dark } = useTheme();
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSelected(null);
    setShowFeedback(false);
    setFeedbackMsg('');
    fadeAnim.setValue(0);
  }, [question.id]);

  const handleSelect = (index) => {
    if (showFeedback) return;
    const correct = index === question.correct;
    setSelected(index);
    setShowFeedback(true);
    setFeedbackMsg(correct ? pickRandom(CORRECT_MESSAGES) : pickRandom(WRONG_MESSAGES));
    onAnswer(question.id, correct);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    setTimeout(() => { scrollRef.current?.scrollToEnd?.({ animated: true }); }, 150);
  };

  const isCorrect = selected === question.correct;

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.counterPill, { backgroundColor: dark ? '#2C2C2E' : '#F0F0F5' }]}>
          <Text style={[styles.counterText, { color: colors.textSecondary }]}>{questionNumber} / {totalQuestions}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.difficultyRow}>
            {[1, 2, 3].map((d) => (
              <View key={d} style={[styles.diffDot, {
                backgroundColor: d <= question.difficulty ? '#FFD60A' : (dark ? '#2C2C2E' : '#E5E5EA'),
              }]} />
            ))}
          </View>
          <TouchableOpacity onPress={() => onBookmark(question.id)} style={[styles.bookmarkBtn, { backgroundColor: isBookmarked ? colors.gold + '20' : (dark ? '#2C2C2E' : '#F0F0F0'), borderRadius: 8 }]}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: isBookmarked ? colors.gold : colors.textSecondary }}>{isBookmarked ? '★' : '☆'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Topic tag */}
      {question.topic && (
        <View style={[styles.topicTag, { backgroundColor: colors.info + '12' }]}>
          <Text style={[styles.topicText, { color: colors.info }]}>{question.topic}</Text>
        </View>
      )}

      {/* Question */}
      <Text style={[styles.questionText, { color: colors.text }]}>{question.text}</Text>

      {/* Options */}
      {question.options.map((option, index) => {
        const isSelected = showFeedback && index === selected;
        const isCorrectOpt = showFeedback && index === question.correct;
        const isWrongSelection = isSelected && !isCorrect;

        let borderCol = dark ? '#38383A' : '#E8E8ED';
        let bgCol = colors.card;
        let labelBg = dark ? '#2C2C2E' : '#F0F0F5';
        let labelCol = colors.textSecondary;
        let textCol = colors.text;
        let indicator = null;

        if (isCorrectOpt) {
          borderCol = colors.success;
          bgCol = colors.success + '0D';
          labelBg = colors.success;
          labelCol = '#fff';
          textCol = colors.success;
          indicator = <View style={[styles.indicator, { backgroundColor: colors.success }]}><Text style={styles.indicatorText}>✓</Text></View>;
        } else if (isWrongSelection) {
          borderCol = colors.danger;
          bgCol = colors.danger + '0D';
          labelBg = colors.danger;
          labelCol = '#fff';
          textCol = colors.danger;
          indicator = <View style={[styles.indicator, { backgroundColor: colors.danger }]}><Text style={styles.indicatorText}>✗</Text></View>;
        } else if (showFeedback) {
          borderCol = dark ? '#2C2C2E' : '#F0F0F5';
          bgCol = dark ? '#1a1a1a' : '#FAFAFA';
          textCol = colors.textSecondary;
        }

        return (
          <TouchableOpacity
            key={index}
            style={[styles.option, { backgroundColor: bgCol, borderColor: borderCol }]}
            onPress={() => handleSelect(index)}
            activeOpacity={showFeedback ? 1 : 0.7}
            disabled={showFeedback}
          >
            <View style={[styles.optionLabel, { backgroundColor: labelBg }]}>
              <Text style={[styles.optionLabelText, { color: labelCol }]}>{OPTION_LABELS[index]}</Text>
            </View>
            <Text style={[styles.optionText, { color: textCol, fontWeight: (isCorrectOpt || isWrongSelection) ? '600' : '400' }]}>{option}</Text>
            {indicator}
          </TouchableOpacity>
        );
      })}

      {/* Feedback Box */}
      {showFeedback && (
        <Animated.View style={[styles.feedbackBox, {
          opacity: fadeAnim,
          backgroundColor: isCorrect ? colors.success + '10' : colors.danger + '10',
          borderColor: isCorrect ? colors.success + '30' : colors.danger + '30',
        }]}>
          <View style={[styles.feedbackHeader, { backgroundColor: isCorrect ? colors.success : colors.danger }]}>
            <Text style={styles.feedbackHeaderText}>{feedbackMsg || (isCorrect ? '✓ Richtig!' : '✗ Falsch!')}</Text>
          </View>
          <View style={styles.feedbackBody}>
            {!isCorrect && (
              <Text style={[styles.feedbackAnswer, { color: colors.text }]}>
                Richtige Antwort: <Text style={{ fontWeight: '700' }}>{OPTION_LABELS[question.correct]}) {question.options[question.correct]}</Text>
              </Text>
            )}
            {question.explanation && (
              <Text style={[styles.feedbackExplanation, { color: colors.textTertiary }]}>{question.explanation}</Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* Next Button */}
      {showFeedback && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.info }]} onPress={onNext} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>Nächste Frage</Text>
            <Text style={styles.nextButtonArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterPill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  counterText: { fontSize: 13, fontWeight: '700' },
  difficultyRow: { flexDirection: 'row', gap: 4 },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  bookmarkBtn: { padding: 4 },
  topicTag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 12 },
  topicText: { fontSize: 12, fontWeight: '600' },
  questionText: { fontSize: 19, fontWeight: '700', marginTop: 16, lineHeight: 28, letterSpacing: -0.3 },
  option: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginTop: 10, borderWidth: 1.5 },
  optionLabel: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  optionLabelText: { fontSize: 14, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },
  indicator: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  indicatorText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  feedbackBox: { marginTop: 18, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  feedbackHeader: { paddingVertical: 10, paddingHorizontal: 16 },
  feedbackHeaderText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  feedbackBody: { padding: 16 },
  feedbackAnswer: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  feedbackExplanation: { fontSize: 14, lineHeight: 21 },
  nextButton: {
    borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 16, gap: 8,
  },
  nextButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  nextButtonArrow: { fontSize: 18, color: 'rgba(255,255,255,0.7)' },
});
