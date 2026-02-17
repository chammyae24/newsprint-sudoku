import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Difficulty } from '../src/core/types';
import {
  hasSavedGameAsync,
  loadGameStateAsync,
} from '../src/storage/gameStorage';
import { useGameStore } from '../src/store/GameStore';
import { LevelSelector } from '../src/ui/components/LevelSelector';

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
  const newGame = useGameStore((state) => state.newGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const [hasSaved, setHasSaved] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      hasSavedGameAsync().then((has) => {
        setHasSaved(has);
        setIsLoading(false);
      });
    }, [])
  );

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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Ransom-Note Title */}
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

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          {/* New Puzzle / Resume Button */}
          <Pressable
            onPress={handleStartOrResume}
            style={({ pressed }) => [
              styles.tornPaperButton,
              pressed && styles.tornPaperButtonPressed,
            ]}
          >
            <Text style={styles.buttonTitle}>
              {hasSaved ? 'RESUME GAME' : 'NEW PUZZLE'}
            </Text>
          </Pressable>

          {/* New Game (if saved exists) */}
          {hasSaved && (
            <Pressable
              onPress={handleNewGame}
              style={({ pressed }) => [
                styles.tornPaperButton,
                pressed && styles.tornPaperButtonPressed,
              ]}
            >
              {/* Postal stamp decoration */}
              <View style={styles.postalStamp}>
                <Text style={styles.postalStampText}>NEW</Text>
              </View>
              <Text style={styles.buttonTitle}>NEW GAME</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // --- Stamp ---
  stampContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    transform: [{ rotate: '3deg' }],
    zIndex: 10,
  },
  stampBorder: {
    borderWidth: 3,
    borderColor: '#A02020',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    opacity: 0.85,
  },
  stampText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 16,
    color: '#A02020',
    fontWeight: '700',
    textAlign: 'center',
  },
  stampSubText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 11,
    color: '#A02020',
    textAlign: 'center',
  },

  // --- Title ---
  titleContainer: {
    alignItems: 'center',
    marginBottom: 36,
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
    gap: 18,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tornPaperButton: {
    width: '80%',
    backgroundColor: '#FDF8F0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#2A2118',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2.5,
    borderColor: '#2A2118',
    borderBottomWidth: 5,
    borderBottomColor: '#1A1410',
  },
  tornPaperButtonPressed: {
    backgroundColor: '#EDE3D0',
    transform: [{ scale: 0.97 }],
    borderBottomWidth: 2,
    marginTop: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
  },
  buttonTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: '#2A2118',
    letterSpacing: 2,
    textAlign: 'center',
  },
  buttonSubtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    color: '#8B7355',
    marginTop: 6,
    textAlign: 'center',
  },

  // Daily Challenge variant
  dailyChallengeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  postalStamp: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#A02020',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.7,
  },
  postalStampText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 8,
    color: '#A02020',
    fontWeight: '700',
  },

  // Settings variant
  settingsButton: {
    backgroundColor: '#E0D5BF',
  },

  // --- Coffee Stain ---
  coffeeStainOuter: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: 'rgba(184, 144, 96, 0.25)',
    opacity: 0.6,
  },
  coffeeStainInner: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(184, 144, 96, 0.15)',
  },
});
