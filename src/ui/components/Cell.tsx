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
 * Individual Sudoku cell component.
 * Supports selection, highlighting, and notes display.
 */
export function Cell({ row, col, cell }: CellProps) {
  const selectedCell = useGameStore(state => state.selectedCell);
  const selectCell = useGameStore(state => state.selectCell);
  const grid = useGameStore(state => state.grid);
  
  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
  const isSameRow = selectedCell?.row === row;
  const isSameCol = selectedCell?.col === col;
  const isSameBox = selectedCell 
    ? Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3)
    : false;
  const isPeer = isSameRow || isSameCol || isSameBox;
  
  // Check if this cell has the same value as selected cell
  const selectedValue = selectedCell ? grid[selectedCell.row][selectedCell.col].value : null;
  const isSameValue = cell.value !== null && cell.value === selectedValue;
  
  // Check if this value is incorrect (value doesn't match solution)
  const isError = cell.value !== null && !cell.isGiven && cell.value !== cell.solutionValue;
  
  // Determine cell background
  const getBackgroundStyle = () => {
    if (isSelected) return styles.selectedBg;
    if (isSameValue) return styles.sameValueBg;
    if (isPeer) return styles.peerBg;
    return null;
  };
  
  // Render notes in 3x3 mini-grid
  const renderNotes = () => {
    if (cell.value !== null || cell.notes.length === 0) return null;
    
    return (
      <View style={styles.notesContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <Text
            key={num}
            style={[
              styles.noteText,
              !cell.notes.includes(num) && styles.noteHidden,
            ]}
          >
            {num}
          </Text>
        ))}
      </View>
    );
  };
  
  const handlePress = () => {
    selectCell(row, col);
  };
  
  return (
    <Pressable
      style={[
        styles.cell,
        getBackgroundStyle(),
        // Box borders
        col % 3 === 2 && col !== 8 && styles.rightBorder,
        row % 3 === 2 && row !== 8 && styles.bottomBorder,
      ]}
      onPress={handlePress}
    >
      {cell.value !== null ? (
        <Text
          style={[
            styles.valueText,
            cell.isGiven && styles.givenText,
            !cell.isGiven && styles.userText,
            isError && styles.errorText,
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

const styles = StyleSheet.create({
  cell: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  selectedBg: {
    backgroundColor: '#bbdefb',
  },
  peerBg: {
    backgroundColor: '#e3f2fd',
  },
  sameValueBg: {
    backgroundColor: '#c8e6c9',
  },
  rightBorder: {
    borderRightWidth: 2,
    borderRightColor: '#374151',
  },
  bottomBorder: {
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
  },
  valueText: {
    fontSize: 24,
    fontWeight: '500',
  },
  givenText: {
    color: '#1f2937',
    fontWeight: '700',
  },
  userText: {
    color: '#2563eb',
  },
  errorText: {
    color: '#dc2626',
  },
  notesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  noteText: {
    fontSize: 9,
    color: '#6b7280',
    width: '33%',
    textAlign: 'center',
    lineHeight: 10,
  },
  noteHidden: {
    opacity: 0,
  },
});
