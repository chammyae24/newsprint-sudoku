import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Difficulty } from '../src/core/types';
import {
  getDailyStateAsync,
  getDailyStreakAsync,
} from '../src/storage/dailyStorage';
import {
  hasSavedGameAsync,
  loadGameStateAsync,
} from '../src/storage/gameStorage';
import { useGameStore } from '../src/store/GameStore';
import { LevelSelector } from '../src/ui/components/LevelSelector';
import { useTheme } from '../src/ui/hooks/useTheme';

// --- Ransom-note title letter data ---
const TITLE_LINE1 = [
  { char: 'N', bg: '#edb942ff', color: '#2e1c00ff', rotate: '-2deg', size: 58 },
  { char: 'E', bg: '#D4C5A8', color: '#2A2118', rotate: '1deg', size: 50 },
  { char: 'W', bg: '#FDF8F0', color: '#2A2118', rotate: '-1deg', size: 52 },
  { char: 'S', bg: '#E0D5BF', color: '#3A2A1C', rotate: '2deg', size: 48 },
  { char: 'P', bg: '#2A2118', color: '#ffffffff', rotate: '-3deg', size: 54 },
  { char: 'R', bg: '#FDF8F0', color: '#2A2118', rotate: '1deg', size: 46 },
  { char: 'I', bg: '#4A3828', color: '#F5EDE0', rotate: '-1deg', size: 50 },
  { char: 'N', bg: '#D4C5A8', color: '#2A2118', rotate: '2deg', size: 48 },
  { char: 'T', bg: '#FDF8F0', color: '#3A2A1C', rotate: '-2deg', size: 52 },
];

const TITLE_LINE2 = [
  { char: 'S', bg: '#E0D5BF', color: '#2A2118', rotate: '2deg', size: 54 },
  { char: 'U', bg: '#2A2118', color: '#F5EDE0', rotate: '-1deg', size: 50 },
  { char: 'D', bg: '#FDF8F0', color: '#2A2118', rotate: '1deg', size: 56 },
  { char: 'O', bg: '#edb942ff', color: '#3A2A1C', rotate: '-2deg', size: 48 },
  { char: 'K', bg: '#4A3828', color: '#F5EDE0', rotate: '3deg', size: 54 },
  { char: 'U', bg: '#FDF8F0', color: '#2A2118', rotate: '-1deg', size: 50 },
];

function RansomLetter({
  char,
  bg,
  color,
  rotate,
  size,
}: {
  char: string;
  bg: string;
  color: string;
  rotate: string;
  size: number;
}) {
  return (
    <View
      style={[
        styles.ransomLetter,
        {
          backgroundColor: bg,
          transform: [{ rotate }],
          paddingHorizontal: size * 0.18,
          paddingVertical: size * 0.06,
          marginHorizontal: 1,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: 'PlayfairDisplay_900Black',
          fontSize: size,
          color,
          lineHeight: size * 1.15,
        }}
      >
        {char}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const newGame = useGameStore((state) => state.newGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const [hasSaved, setHasSaved] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);

  const startDailyChallenge = useGameStore(
    (state) => state.startDailyChallenge
  );

  useFocusEffect(
    useCallback(() => {
      hasSavedGameAsync().then((has) => {
        setHasSaved(has);
        setIsLoading(false);
      });
      getDailyStateAsync().then((state) => {
        if (state && state.completed) {
          setDailyCompleted(true);
        } else {
          setDailyCompleted(false);
        }
      });
      getDailyStreakAsync().then((streak) => setDailyStreak(streak));
    }, [])
  );

  const handleDailyChallenge = () => {
    startDailyChallenge();
    setHasSaved(false); // Daily challenge overwrites current session if any (or we could save it separately, but keeping simple for now)
    router.push('/game');
  };

  const handleStartOrResume = async () => {
    if (hasSaved) {
      const savedState = await loadGameStateAsync();
      if (savedState) {
        resumeGame(savedState);
        router.push('/game');
      } else {
        setShowLevelSelector(true);
      }
    } else {
      setShowLevelSelector(true);
    }
  };

  const handleSelectLevel = (difficulty: Difficulty) => {
    newGame(difficulty);
    setHasSaved(false);
    router.push('/game');
  };

  const handleNewGame = () => {
    setShowLevelSelector(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Layer 1: Title (Always Centered) */}
      <View style={styles.centeredLayer} pointerEvents="none">
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            {TITLE_LINE1.map((l, i) => (
              <RansomLetter key={i} {...l} />
            ))}
          </View>
          <View style={[styles.titleRow, { marginTop: 4 }]}>
            {TITLE_LINE2.map((l, i) => (
              <RansomLetter key={i} {...l} />
            ))}
          </View>
        </View>
      </View>

      {/* Layer 2: Menu Buttons (Offset below title) */}
      <View style={styles.menuLayer} pointerEvents="box-none">
        <View style={styles.menuContainer}>
          {/* Daily Challenge Button - Compact */}
          <Pressable
            onPress={handleDailyChallenge}
            style={({ pressed }) => [
              styles.tornPaperButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderBottomColor: theme.text,
              },
              pressed && [
                styles.tornPaperButtonPressed,
                { backgroundColor: theme.surfaceAlt },
              ],
            ]}
          >
            <Text style={[styles.buttonTitle, { color: theme.text }]}>
              TODAY'S PUZZLE
            </Text>
            {dailyCompleted && (
              <Text style={styles.completedBadge}>✅ Completed</Text>
            )}
          </Pressable>

          {/* New Puzzle / Resume Button */}
          <Pressable
            onPress={handleStartOrResume}
            style={({ pressed }) => [
              styles.tornPaperButton,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderBottomColor: theme.text,
              },
              pressed && [
                styles.tornPaperButtonPressed,
                { backgroundColor: theme.surfaceAlt },
              ],
            ]}
          >
            <Text style={[styles.buttonTitle, { color: theme.text }]}>
              {hasSaved ? 'RESUME GAME' : 'NEW PUZZLE'}
            </Text>
          </Pressable>

          {/* New Game (if saved exists) */}
          {hasSaved && (
            <Pressable
              onPress={handleNewGame}
              style={({ pressed }) => [
                styles.tornPaperButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderBottomColor: theme.text,
                },
                pressed && [
                  styles.tornPaperButtonPressed,
                  { backgroundColor: theme.surfaceAlt },
                ],
              ]}
            >
              <Text style={[styles.buttonTitle, { color: theme.text }]}>
                NEW GAME
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Achievements Button - Top Right (Innermost) */}
      <Pressable
        onPress={() => router.push('/achievements' as any)}
        style={({ pressed }) => [
          styles.cornerButton,
          styles.achievementsButtonPosition,
          pressed && styles.cornerButtonPressed,
        ]}
      >
        <Text style={styles.emojiText}>🏆</Text>
      </Pressable>

      {/* Stats Button - Top Right (Middle) */}
      <Pressable
        onPress={() => router.push('/stats' as any)}
        style={({ pressed }) => [
          styles.cornerButton,
          styles.statsButtonPosition,
          pressed && styles.cornerButtonPressed,
        ]}
      >
        <Text style={styles.emojiText}>📊</Text>
      </Pressable>

      {/* Settings Button - Top Right (Outer) */}
      <Pressable
        onPress={() => router.push('/settings' as any)}
        style={({ pressed }) => [
          styles.cornerButton,
          styles.settingsButtonPosition,
          pressed && styles.cornerButtonPressed,
        ]}
      >
        <Text style={styles.emojiText}>⚙️</Text>
      </Pressable>

      {/* Level Selector Drawer */}
      <LevelSelector
        visible={showLevelSelector}
        onClose={() => setShowLevelSelector(false)}
        onSelectLevel={handleSelectLevel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE0',
  },

  // --- Layers ---
  centeredLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingBottom: 80, // Visual adjustment to center title slightly higher visually if needed
  },
  menuLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    paddingTop: 220, // Push buttons down below the title
  },

  // --- Title ---
  titleContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ransomLetter: {
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },

  // --- Menu Buttons ---
  menuContainer: {
    gap: 12,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 100,
  },
  tornPaperButton: {
    width: 'auto',
    minWidth: 200,
    maxWidth: '80%',
    backgroundColor: '#FDF8F0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A2118',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#2A2118',
    borderBottomWidth: 4,
    borderBottomColor: '#1A1410',
  },
  tornPaperButtonPressed: {
    backgroundColor: '#EDE3D0',
    transform: [{ scale: 0.98 }, { translateY: 2 }],
    borderBottomWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  buttonTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: '#2A2118',
    letterSpacing: 1,
    textAlign: 'center',
  },
  completedBadge: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 11,
    color: '#3A8F3A',
    marginTop: 2,
  },

  // --- Corner Buttons ---
  cornerButton: {
    position: 'absolute',
    top: 60,
    width: 44,
    height: 44,
    backgroundColor: '#E0D5BF',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2A2118',
    borderBottomWidth: 4,
    borderBottomColor: '#1A1410',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  cornerButtonPressed: {
    transform: [{ scale: 0.95 }, { translateY: 2 }],
    borderBottomWidth: 2,
  },
  achievementsButtonPosition: {
    right: 136,
  },
  statsButtonPosition: {
    right: 80,
  },
  settingsButtonPosition: {
    right: 24,
  },
  emojiText: {
    fontSize: 22,
  },
});
