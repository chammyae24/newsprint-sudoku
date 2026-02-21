import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';
import { useTheme } from '../hooks/useTheme';

/**
 * Displays remaining lives as hearts — filled or X-crossed, themed.
 */
export const LivesDisplay: React.FC = () => {
  const theme = useTheme();
  const { mistakes, maxMistakes } = useGameStore();
  const remainingLives = maxMistakes - mistakes;

  const hearts = Array.from({ length: maxMistakes }, (_, index) => {
    const isFilled = index < remainingLives;
    return (
      <View key={index} style={styles.heartContainer}>
        <Text
          style={[
            styles.heart,
            { color: theme.error },
            !isFilled && { opacity: 0.3 },
          ]}
        >
          ♥
        </Text>
        {!isFilled && (
          <Text style={[styles.cross, { color: theme.text }]}>✕</Text>
        )}
      </View>
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.heartsRow}>{hearts}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heartContainer: {
    position: 'relative',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    fontSize: 22,
  },
  cross: {
    position: 'absolute',
    fontSize: 26,
    fontWeight: '700',
    top: -1,
  },
});

export default LivesDisplay;
