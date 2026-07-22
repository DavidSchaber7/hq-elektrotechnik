import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../utils/theme';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function ExamQuestionCard({
  question, questionNumber, totalQuestions, onAnswer, onBookmark, isBookmarked, selectedAnswer,
}) {
  const { colors, dark } = useTheme();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={[s.counter, { color: colors.textSecondary }]}>Frage {questionNumber} / {totalQuestions}</Text>
        <TouchableOpacity onPress={() => onBookmark(question.id)} style={[s.bookmarkBtn, { backgroundColor: isBookmarked ? colors.gold + '20' : (dark ? '#2C2C2E' : '#F0F0F0') }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: isBookmarked ? colors.gold : colors.textSecondary }}>{isBookmarked ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>
      <View style={s.meta}>
        <Text style={s.difficulty}>{'⭐'.repeat(question.difficulty)}{'☆'.repeat(3 - question.difficulty)}</Text>
        {question.topic && <Text style={[s.topic, { color: colors.info, backgroundColor: colors.info + '15' }]}>{question.topic}</Text>}
      </View>
      <Text style={[s.questionText, { color: colors.text }]}>{question.text}</Text>

      {question.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[s.option, { backgroundColor: colors.card, borderColor: colors.border },
            selectedAnswer === index && { borderColor: colors.info, backgroundColor: colors.info + '10' },
          ]}
          onPress={() => onAnswer(question.id, index)}
          activeOpacity={0.7}
        >
          <Text style={[s.optionLabel, { backgroundColor: dark ? '#2C2C2E' : '#F2F2F7', color: colors.textSecondary },
            selectedAnswer === index && { backgroundColor: colors.info, color: '#fff' },
          ]}>{OPTION_LABELS[index]}</Text>
          <Text style={[s.optionText, { color: colors.text },
            selectedAnswer === index && { color: colors.info, fontWeight: '600' },
          ]}>{option}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { fontSize: 14, fontWeight: '600' },
  bookmarkBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  difficulty: { fontSize: 14 },
  topic: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  questionText: { fontSize: 18, fontWeight: '600', marginTop: 16, lineHeight: 26 },
  option: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 16, marginTop: 10, borderWidth: 2 },
  optionLabel: { width: 30, height: 30, borderRadius: 15, textAlign: 'center', lineHeight: 30, fontSize: 14, fontWeight: '700', overflow: 'hidden', marginRight: 12 },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },
});
