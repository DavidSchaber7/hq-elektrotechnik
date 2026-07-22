import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { getSettings, saveSettings } from './storage';

// Duolingo-inspired color palette
const BRAND = '#58CC02';   // Primary green
const BRAND_DARK = '#4CAD00';

const lightColors = {
  background: '#F7F7F7',
  card: '#FFFFFF',
  text: '#3C3C3C',
  textSecondary: '#AFAFAF',
  textTertiary: '#777777',
  border: '#E5E5E5',
  headerBg: '#FFFFFF',
  headerText: '#3C3C3C',
  tabBar: '#FFFFFF',
  inputBg: '#F0F0F0',
  // Brand
  brand: BRAND,
  brandDark: BRAND_DARK,
  // Semantic
  success: '#58CC02',
  danger: '#FF4B4B',
  warning: '#FFC800',
  info: '#1CB0F6',
  gold: '#FFC800',
  purple: '#CE82FF',
  // Specific
  streakOrange: '#FF9600',
  correctGreen: '#58CC02',
  wrongRed: '#FF4B4B',
};

const darkColors = {
  background: '#131F24',
  card: '#1F3038',
  text: '#FFFFFF',
  textSecondary: '#8A9BA3',
  textTertiary: '#B0BEC5',
  border: '#2A3F47',
  headerBg: '#1A2C34',
  headerText: '#FFFFFF',
  tabBar: '#1A2C34',
  inputBg: '#253840',
  // Brand
  brand: '#58CC02',
  brandDark: BRAND_DARK,
  // Semantic
  success: '#58CC02',
  danger: '#FF4B4B',
  warning: '#FFC800',
  info: '#1CB0F6',
  gold: '#FFC800',
  purple: '#CE82FF',
  // Specific
  streakOrange: '#FF9600',
  correctGreen: '#58CC02',
  wrongRed: '#FF4B4B',
};

const ThemeContext = createContext({ dark: false, colors: lightColors, toggle: () => {} });

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');

  useEffect(() => {
    getSettings().then((s) => {
      if (s.darkMode === true) setMode('dark');
      else if (s.darkMode === false) setMode('light');
      else setMode('system');
    });
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const toggle = useCallback(async () => {
    const next = isDark ? 'light' : 'dark';
    setMode(next);
    await saveSettings({ darkMode: next === 'dark' });
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ dark: isDark, colors, toggle, mode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
