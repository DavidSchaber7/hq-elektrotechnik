import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../utils/theme';
import { usePremium } from '../contexts/PremiumContext';

const FEATURES = [
  {
    icon: 'library',
    title: 'Alle 3 Fächer',
    desc: 'Volle Inhalte: Technik, Organisation, Führung und Personal',
  },
  {
    icon: 'list',
    title: '600+ Prüfungsfragen',
    desc: 'Jede Frage mit ausführlicher Erklärung',
  },
  {
    icon: 'timer',
    title: 'Vollständige Prüfungssimulation',
    desc: '30 Fragen in 45 Min – wie in der echten IHK-Prüfung',
  },
  {
    icon: 'analytics',
    title: 'Erweiterte Statistiken',
    desc: 'Fortschritt, Schwächen-Analyse, Lerntrend',
  },
  {
    icon: 'cloud-offline',
    title: 'Komplett offline nutzbar',
    desc: 'Lernen wo immer du bist – ohne Internet',
  },
  {
    icon: 'infinite',
    title: 'Einmalig kaufen, für immer nutzen',
    desc: 'Kein Abo. Alle zukünftigen Updates inklusive.',
  },
];

export default function PaywallScreen({ navigation }) {
  const { colors } = useTheme();
  const { purchase, restore, priceLabel } = usePremium();
  const [busy, setBusy] = useState(false);

  const handlePurchase = async () => {
    setBusy(true);
    try {
      const result = await purchase();
      setBusy(false);
      // result === null  → user cancelled (no alert)
      // result === true  → purchase sheet opened successfully; listener will set isPremium
      // result === false → actual error
      if (result === true) {
        Alert.alert(
          'Premium freigeschaltet! 🎉',
          'Alle Fächer und Funktionen stehen dir jetzt zur Verfügung.',
          [{ text: 'Loslegen', onPress: () => navigation.goBack() }]
        );
      } else if (result === false) {
        Alert.alert('Kauf fehlgeschlagen', 'Bitte versuche es noch einmal oder stelle sicher, dass In-App-Käufe auf deinem Gerät aktiviert sind.');
      }
      // result === null → user cancelled, no alert
    } catch (e) {
      setBusy(false);
      Alert.alert('Fehler', 'Beim Kauf ist ein Fehler aufgetreten.');
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    if (ok) {
      Alert.alert('Käufe wiederhergestellt', 'Premium ist freigeschaltet.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Keine Käufe gefunden', 'Es wurde kein vorheriger Kauf gefunden.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a1340' }}>
      <LinearGradient
        colors={['#0a1340', '#1a2970', '#243888']}
        style={StyleSheet.absoluteFill}
      />
      {/* Close button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.closeBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.crownWrap}>
            <Ionicons name="star" size={48} color="#FFC33C" />
          </View>
          <Text style={styles.title}>HQ Elektrotechnik Premium</Text>
          <Text style={styles.subtitle}>
            Schalte alle Fächer und Funktionen frei – einmalig.
          </Text>
        </View>

        {/* Big stat */}
        <View style={styles.statBadge}>
          <Text style={styles.statNum}>600+</Text>
          <Text style={styles.statLabel}>Prüfungsfragen warten auf dich</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresWrap}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={22} color="#FFC33C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={handlePurchase}
          disabled={busy}
        >
          <LinearGradient
            colors={['#FFD84D', '#FFB020']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            {busy ? (
              <ActivityIndicator color="#1A2970" />
            ) : (
              <>
                <Text style={styles.ctaText}>Jetzt freischalten</Text>
                <Text style={styles.ctaPrice}>{priceLabel} · einmalig</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.terms}>
          Einmalkauf · Kein Abo · Sicher abgewickelt über Apple/Google
        </Text>

        <TouchableOpacity onPress={handleRestore} disabled={busy} style={styles.restore}>
          <Text style={styles.restoreText}>Käufe wiederherstellen</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  crownWrap: {
    width: 88, height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,195,60,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,195,60,0.4)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 30, fontWeight: '800', color: '#fff',
    letterSpacing: -0.5, textAlign: 'center',
  },
  subtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', marginTop: 8, paddingHorizontal: 16,
    lineHeight: 22,
  },
  statBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    marginVertical: 16,
  },
  statNum: { fontSize: 38, fontWeight: '900', color: '#FFC33C', letterSpacing: -1 },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  featuresWrap: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  featureIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,195,60,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  featureTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  featureDesc: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2, lineHeight: 18 },

  cta: { borderRadius: 20, overflow: 'hidden', shadowColor: '#FFB020', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  ctaGradient: { paddingVertical: 20, alignItems: 'center' },
  ctaText: { fontSize: 20, fontWeight: '800', color: '#1A2970', letterSpacing: -0.3 },
  ctaPrice: { fontSize: 14, fontWeight: '700', color: '#1A2970', opacity: 0.7, marginTop: 2 },

  terms: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 14 },

  restore: { alignSelf: 'center', marginTop: 18, paddingVertical: 8, paddingHorizontal: 16 },
  restoreText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textDecorationLine: 'underline' },
});
