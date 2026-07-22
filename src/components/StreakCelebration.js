import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal } from 'react-native';

/**
 * Full-screen celebration overlay that auto-dismisses after 2s.
 * Show it when the user first hits their daily goal.
 */
export default function StreakCelebration({ visible, streak, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      const t = setTimeout(onDismiss, 2200);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.flame}>🔥</Text>
          <Text style={styles.title}>Tagesziel erreicht!</Text>
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>Tage in Folge</Text>
          <Text style={styles.sub}>Mach weiter so – du bist auf Kurs!</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1a2970',
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,195,60,0.3)',
    shadowColor: '#FFC33C',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  flame: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 16 },
  streakNum: { fontSize: 72, fontWeight: '900', color: '#FFC33C', lineHeight: 76, letterSpacing: -2 },
  streakLabel: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 16 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
});
