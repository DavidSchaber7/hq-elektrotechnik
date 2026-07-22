import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Dimensions, FlatList, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '📚',
    title: 'Dein Weg zum\nIndustriemeister',
    desc: '600 Prüfungsfragen in 3 Fächern.\nAlles was du zum Bestehen brauchst.',
    grad: ['#1a2970', '#3755B4'],
    accent: '#FFC33C',
  },
  {
    emoji: '🧠',
    title: 'Intelligent lernen',
    desc: 'Spaced Repetition wiederholt schwierige\nFragen öfter – wissenschaftlich bewiesen.',
    grad: ['#1a0a40', '#5B2D8E'],
    accent: '#C084FC',
  },
  {
    emoji: '⏱️',
    title: 'Echte IHK-Prüfung',
    desc: '30 Fragen · 45 Minuten.\nSimuliere die Prüfung unter\nrealistischen Bedingungen.',
    grad: ['#0a2a1a', '#166534'],
    accent: '#4ADE80',
  },
  {
    emoji: '🔥',
    title: 'Dranbleiben zahlt sich aus',
    desc: 'Baue eine Lernstreak auf und\nerreiche täglich dein Ziel.\nKontinuität schlägt Intensität.',
    grad: ['#2a0a0a', '#9B1C1C'],
    accent: '#FB923C',
  },
];

export default function OnboardingScreen({ onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem('hq_onboarding_done', 'true');
    onDone();
  };

  const slide = SLIDES[currentIndex];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) =>
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <LinearGradient colors={item.grad} style={[styles.slide, { width }]}>
            <SafeAreaView style={styles.slideInner}>
              <View style={styles.topSpacer} />

              {/* Big emoji in glowing circle */}
              <View style={[styles.emojiWrap, { borderColor: item.accent + '40', shadowColor: item.accent }]}>
                <View style={[styles.emojiInner, { backgroundColor: item.accent + '20' }]}>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                </View>
              </View>

              {/* Text */}
              <Text style={[styles.title, { color: '#fff' }]}>{item.title}</Text>
              <Text style={[styles.desc, { color: 'rgba(255,255,255,0.75)' }]}>{item.desc}</Text>

              {/* Accent bar */}
              <View style={[styles.accentBar, { backgroundColor: item.accent }]} />
            </SafeAreaView>
          </LinearGradient>
        )}
      />

      {/* Footer outside slides */}
      <LinearGradient colors={slide.grad} style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex
                  ? [styles.dotActive, { backgroundColor: slide.accent }]
                  : { backgroundColor: 'rgba(255,255,255,0.3)' },
              ]}
            />
          ))}
        </View>

        <View style={styles.btnRow}>
          {currentIndex < SLIDES.length - 1 && (
            <TouchableOpacity onPress={finish} style={styles.skipBtn}>
              <Text style={styles.skipText}>Überspringen</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: slide.accent }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextText, { color: currentIndex === SLIDES.length - 1 ? '#1a1a1a' : '#1a1a1a' }]}>
              {currentIndex === SLIDES.length - 1 ? 'Los geht\'s 🚀' : 'Weiter →'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a1340' },
  slide: { flex: 1 },
  slideInner: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  topSpacer: { flex: 0.15 },
  emojiWrap: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  emojiInner: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 72 },
  title: {
    fontSize: 34, fontWeight: '800', textAlign: 'center',
    lineHeight: 42, letterSpacing: -0.8, marginBottom: 16,
  },
  desc: {
    fontSize: 17, textAlign: 'center', lineHeight: 26,
  },
  accentBar: { width: 48, height: 4, borderRadius: 2, marginTop: 32 },
  footer: { paddingBottom: 40, paddingHorizontal: 24, paddingTop: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 28, borderRadius: 4 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  skipText: { fontSize: 16, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  nextBtn: {
    flex: 2, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
});
