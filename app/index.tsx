import { Link } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Difficulty } from '../src/core/types';
import { useGameStore } from '../src/store/GameStore';
import { Cell } from '../src/ui/components/Cell';
import { Eraser } from '../src/ui/components/Eraser';
import { InputModeSwitcher } from '../src/ui/components/InputModeSwitcher';
import { Keypad } from '../src/ui/components/Keypad';

export default function GameScreen() {
  const grid = useGameStore(state => state.grid);
  const newGame = useGameStore(state => state.newGame);
  const mistakes = useGameStore(state => state.mistakes);
  const maxMistakes = useGameStore(state => state.maxMistakes);
  const inputMode = useGameStore(state => state.inputMode);
  const selectedCell = useGameStore(state => state.selectedCell);

  // Start a new game on mount
  useEffect(() => {
    newGame(Difficulty.EASY);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Newsprint Sudoku</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            Mistakes: {mistakes}/{maxMistakes}
          </Text>
          <Text style={styles.statsText}>
            Mode: {inputMode === 'solve' ? '✏️ Solve' : '📝 Notes'}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
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
      <View style={styles.selectionInfo}>
        {selectedCell ? (
          <Text style={styles.selectionText}>
            Selected: Row {selectedCell.row + 1}, Col {selectedCell.col + 1}
          </Text>
        ) : (
          <Text style={styles.selectionText}>Tap a cell to select</Text>
        )}
      </View>

      {/* Input Mode Switcher */}
      <InputModeSwitcher />

      {/* Keypad */}
      <Keypad />

      {/* Actions */}
      <View style={styles.actions}>
        <Eraser />
        <Pressable 
          style={styles.newGameButton} 
          onPress={() => newGame(Difficulty.EASY)}
        >
          <Text style={styles.newGameText}>🔄 New Game</Text>
        </Pressable>
        <Link href={"/test/handwriting" as any} style={styles.testLink}>
          <Text style={styles.testLinkText}>✏️ Test Handwriting</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  gridContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  grid: {
    borderWidth: 2,
    borderColor: '#374151',
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
  },
  selectionInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    gap: 6,
  },
  newGameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1d4ed8',
  },
  testLink: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
  },
  testLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d97706',
  },
});
