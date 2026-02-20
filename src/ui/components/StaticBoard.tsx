import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';

export function StaticBoard() {
  const grid = useGameStore((state) => state.grid);

  return (
    <View style={styles.gridWrapper}>
      <View style={styles.gridBorder}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((cell, colIndex) => {
              const borderRight =
                colIndex % 3 === 2 && colIndex !== 8 ? 2.5 : 0.5;
              const borderBottom =
                rowIndex % 3 === 2 && rowIndex !== 8 ? 2.5 : 0.5;

              return (
                <View
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    {
                      borderRightWidth: borderRight,
                      borderBottomWidth: borderBottom,
                      borderRightColor: borderRight > 1 ? '#2A2118' : '#C4B08A',
                      borderBottomColor:
                        borderBottom > 1 ? '#2A2118' : '#C4B08A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.value,
                      cell.isGiven ? styles.givenValue : styles.userValue,
                    ]}
                  >
                    {cell.value}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  gridBorder: {
    borderWidth: 3,
    borderColor: '#2A2118',
    backgroundColor: '#F5EDE0',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#C4B08A',
    backgroundColor: '#F5EDE0',
  },
  value: {
    fontSize: 20,
    lineHeight: 30,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  givenValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#2A2118',
  },
  userValue: {
    fontFamily: 'GloriaHallelujah_400Regular',
    fontSize: 18,
    color: '#1d1df6ff', // Same color as standard userValue in Cell.tsx
  },
});
