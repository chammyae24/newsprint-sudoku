import { Link } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { Difficulty } from '../../src/core/types';
import { useGameStore } from '../../src/store/GameStore';
import { Cell } from '../../src/ui/components/Cell';
import { Eraser } from '../../src/ui/components/Eraser';
import { InputModeSwitcher } from '../../src/ui/components/InputModeSwitcher';
import { Keypad } from '../../src/ui/components/Keypad';

export default function GameScreen() {
  const grid = useGameStore((state) => state.grid);
  const newGame = useGameStore((state) => state.newGame);
  const mistakes = useGameStore((state) => state.mistakes);
  const maxMistakes = useGameStore((state) => state.maxMistakes);
  const inputMode = useGameStore((state) => state.inputMode);
  const selectedCell = useGameStore((state) => state.selectedCell);

  // Start a new game on mount
  useEffect(() => {
    newGame(Difficulty.EASY);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-5 pb-2 pt-4">
        <Text className="text-center text-2xl font-bold text-gray-800">
          Newsprint Sudoku
        </Text>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-sm text-gray-500">
            Mistakes: {mistakes}/{maxMistakes}
          </Text>
          <Text className="text-sm text-gray-500">
            Mode: {inputMode === 'solve' ? '✏️ Solve' : '📝 Notes'}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <View className="items-center py-4">
        <View className="border-2 border-gray-700 bg-white">
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row">
              {row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  row={rowIndex}
                  col={colIndex}
                  cell={cell}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Selected cell info */}
      <View className="items-center py-2">
        {selectedCell ? (
          <Text className="text-sm text-gray-500">
            Selected: Row {selectedCell.row + 1}, Col {selectedCell.col + 1}
          </Text>
        ) : (
          <Text className="text-sm text-gray-500">Tap a cell to select</Text>
        )}
      </View>

      {/* Input Mode Switcher */}
      <InputModeSwitcher />

      {/* Keypad */}
      <Keypad />

      {/* Actions */}
      <View className="flex-row items-center justify-center gap-4 py-3">
        <Eraser />
        <Pressable
          className="flex-row items-center gap-1.5 rounded-full bg-blue-100 px-4 py-2.5"
          onPress={() => newGame(Difficulty.EASY)}
        >
          <Text className="text-sm font-medium text-blue-700">🔄 New Game</Text>
        </Pressable>
        <Link
          href={'/test/handwriting' as any}
          className="rounded-full bg-amber-100 px-4 py-2.5"
        >
          <Text className="text-sm font-medium text-amber-600">
            ✏️ Test Handwriting
          </Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
