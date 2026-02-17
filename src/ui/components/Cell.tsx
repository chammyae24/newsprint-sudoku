import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SudokuCell as SudokuCellType } from '../../core/types';
import { useGameStore } from '../../store/GameStore';

interface CellProps {
  row: number;
  col: number;
  cell: SudokuCellType;
}

/**
 * Individual Sudoku cell — newsprint styled.
 */
export function Cell({ row, col, cell }: CellProps) {
  const activeHint = useGameStore((state) => state.activeHint);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const selectCell = useGameStore((state) => state.selectCell);
  const grid = useGameStore((state) => state.grid);
  const fastSolveDigit = useGameStore((state) => state.fastSolveDigit);
  const placeFastSolveDigit = useGameStore(
    (state) => state.placeFastSolveDigit
  );
  const isDrawingMode = useGameStore((state) => state.isDrawingMode);
  const highlightDigit = useGameStore((state) => state.highlightDigit);

  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
  const isSameRow = selectedCell?.row === row;
  const isSameCol = selectedCell?.col === col;
  const isSameBox = selectedCell
    ? Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3)
    : false;
  const isPeer = isSameRow || isSameCol || isSameBox;

  // Hint Logic
  const isHintPrimary = activeHint?.primaryCells.some(
    (c) => c.row === row && c.col === col
  );
  const isHintSecondary = activeHint?.secondaryCells?.some(
    (c) => c.row === row && c.col === col
  );
  const hintPlacement =
    activeHint?.placement?.row === row && activeHint?.placement?.col === col
      ? activeHint?.placement?.value
      : null;
  const hintEliminations = activeHint?.eliminations
    .filter((e) => e.row === row && e.col === col)
    .map((e) => e.value);

  const selectedValue = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : null;
  const highlightValue =
    fastSolveDigit !== null
      ? fastSolveDigit
      : isDrawingMode && highlightDigit !== null
        ? highlightDigit
        : selectedValue;
  const isSameValue = cell.value !== null && cell.value === highlightValue;
  const isError =
    cell.value !== null && !cell.isGiven && cell.value !== cell.solutionValue;
  const isFastSolveTarget =
    fastSolveDigit !== null && cell.value === null && !cell.isGiven;

  // --- Border logic for thick 3x3 box edges ---
  const borderRight = col % 3 === 2 && col !== 8 ? 2.5 : 0.5;
  const borderBottom = row % 3 === 2 && row !== 8 ? 2.5 : 0.5;

  // --- Background color based on state ---
  let bgColor = '#F5EDE0'; // parchment-100
  if (isSelected) {
    bgColor = '#E8D8B8';
  } else if (isSameValue) {
    bgColor = '#DDD0B0';
  } else if (isPeer) {
    bgColor = '#EDE3D0';
  }
  if (isFastSolveTarget) {
    bgColor = '#EDE3D0';
  }
  // Hint overrides
  if (isHintPrimary) bgColor = '#E8D5A0';
  if (isHintSecondary) bgColor = '#EDE0C0';
  if (hintPlacement !== null) bgColor = '#D5E0C0';

  // Render notes
  const renderNotes = () => {
    if (cell.value !== null) return null;
    if (cell.notes.length === 0 && !hintPlacement) return null;

    return (
      <View style={noteStyles.container}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isEliminated = hintEliminations?.includes(num);
          const isPlacement = hintPlacement === num;
          const isNotePresent = cell.notes.includes(num);

          if (!isNotePresent && !isPlacement) {
            return (
              <Text
                key={num}
                style={[noteStyles.note, { color: 'transparent' }]}
              >
                {num}
              </Text>
            );
          }

          return (
            <Text
              key={num}
              style={[
                noteStyles.note,
                !isEliminated && !isPlacement && { color: '#8B7355' },
                isEliminated && {
                  color: '#A02020',
                  fontWeight: '700',
                  textDecorationLine: 'line-through',
                },
                isPlacement && {
                  color: '#3A7A3A',
                  fontWeight: '700',
                },
              ]}
            >
              {num}
            </Text>
          );
        })}
      </View>
    );
  };

  const clearCell = useGameStore((state) => state.clearCell);
  const selectCellAction = useGameStore((state) => state.selectCell);

  const handlePress = async () => {
    if (fastSolveDigit !== null) {
      if (
        cell.value === fastSolveDigit &&
        !cell.isGiven &&
        cell.value !== cell.solutionValue
      ) {
        selectCellAction(row, col);
        clearCell();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      if (cell.value === null && !cell.isGiven) {
        const isCorrect = placeFastSolveDigit(row, col);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!isCorrect) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
        }
        return;
      }
    }
    selectCellAction(row, col);
  };

  return (
    <Pressable
      style={[
        cellStyles.cell,
        {
          backgroundColor: bgColor,
          borderRightWidth: borderRight,
          borderBottomWidth: borderBottom,
          borderRightColor: borderRight > 1 ? '#2A2118' : '#C4B08A',
          borderBottomColor: borderBottom > 1 ? '#2A2118' : '#C4B08A',
        },
      ]}
      onPress={handlePress}
    >
      {cell.value !== null ? (
        <Text
          style={[
            cellStyles.value,
            cell.isGiven && cellStyles.givenValue,
            !cell.isGiven && cellStyles.userValue,
            isError && cellStyles.errorValue,
            hintPlacement === cell.value && cellStyles.hintValue,
          ]}
        >
          {cell.value}
        </Text>
      ) : (
        renderNotes()
      )}
    </Pressable>
  );
}

const cellStyles = StyleSheet.create({
  cell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#C4B08A',
  },
  value: {
    fontSize: 22,
  },
  givenValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2A2118',
  },
  userValue: {
    fontFamily: 'Lora_400Regular',
    color: '#4A3828',
  },
  errorValue: {
    color: '#A02020',
  },
  hintValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#3A7A3A',
  },
});

const noteStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
  },
  note: {
    width: '33%',
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 10,
    fontFamily: 'Lora_400Regular',
    color: '#8B7355',
  },
});
