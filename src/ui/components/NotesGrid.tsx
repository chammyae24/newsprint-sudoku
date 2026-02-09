import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface NotesGridProps {
  notes: number[];
  size: number; // Cell size in pixels
}

/**
 * Renders a 3x3 grid of candidate digits within a cell.
 * Each candidate digit 1-9 is positioned in its corresponding spot.
 */
export const NotesGrid: React.FC<NotesGridProps> = ({ notes, size }) => {
  if (notes.length === 0) return null;

  const noteSet = new Set(notes);
  const noteSize = size / 3;
  const fontSize = noteSize * 0.6;

  // 3x3 layout: digit positions
  // 1 2 3
  // 4 5 6
  // 7 8 9
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {digits.map((digit) => {
        const row = Math.floor((digit - 1) / 3);
        const col = (digit - 1) % 3;

        return (
          <View
            key={digit}
            style={[
              styles.noteCell,
              {
                width: noteSize,
                height: noteSize,
                left: col * noteSize,
                top: row * noteSize,
              },
            ]}
          >
            {noteSet.has(digit) && (
              <Text style={[styles.noteText, { fontSize }]}>{digit}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  noteCell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteText: {
    color: '#666666',
    fontFamily: 'System',
    fontWeight: '400',
  },
});

export default NotesGrid;
