import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Difficulty } from '../src/core/types';
import {
  hasSavedGameAsync,
  loadGameStateAsync,
} from '../src/storage/gameStorage';
import { useGameStore } from '../src/store/GameStore';
import { LevelSelector } from '../src/ui/components/LevelSelector';

export default function HomeScreen() {
  const router = useRouter();
  const newGame = useGameStore((state) => state.newGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const [hasSaved, setHasSaved] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved game whenever screen gains focus
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
      // Resume existing game
      const savedState = await loadGameStateAsync();
      if (savedState) {
        resumeGame(savedState);
        router.push('/game');
      } else {
        // Fallback if load fails
        setShowLevelSelector(true);
      }
    } else {
      // Show level selector for new game
      setShowLevelSelector(true);
    }
  };

  const handleSelectLevel = (difficulty: Difficulty) => {
    newGame(difficulty);
    setHasSaved(false); // Clear saved state flag
    router.push('/game');
  };

  const handleNewGame = () => {
    // Force new game even if saved game exists
    setShowLevelSelector(true);
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
      {/* Header */}
      <View className="px-5 pb-2 pt-4">
        <Text className="text-center text-2xl font-bold text-gray-800">
          Newsprint Sudoku
        </Text>
      </View>

      {/* Actions */}
      <View className="items-center justify-center gap-4 py-3">
        <Pressable
          onPress={handleStartOrResume}
          className="rounded-full bg-amber-100 px-4 py-2.5"
        >
          <Text className="text-sm font-medium text-amber-600">
            {hasSaved ? '▶️ Resume Game' : '🎮 Start Game'}
          </Text>
        </Pressable>

        {hasSaved && (
          <Pressable
            onPress={handleNewGame}
            className="rounded-full bg-slate-100 px-4 py-2.5"
          >
            <Text className="text-sm font-medium text-slate-600">
              🆕 New Game
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push('/test/handwriting' as never)}
          className="rounded-full bg-amber-100 px-4 py-2.5"
        >
          <Text className="text-sm font-medium text-amber-600">
            ✏️ Test Handwriting
          </Text>
        </Pressable>
      </View>

      {/* Level Selector Drawer */}
      <LevelSelector
        visible={showLevelSelector}
        onClose={() => setShowLevelSelector(false)}
        onSelectLevel={handleSelectLevel}
      />
    </SafeAreaView>
  );
}
