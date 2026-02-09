import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';

/**
 * Displays remaining lives as hearts and mistake count.
 */
export const LivesDisplay: React.FC = () => {
  const { mistakes, maxMistakes } = useGameStore();
  const remainingLives = maxMistakes - mistakes;

  // Create array of hearts
  const hearts = Array.from({ length: maxMistakes }, (_, index) => {
    const isFilled = index < remainingLives;
    return (
      <Text
        key={index}
        style={[styles.heart, isFilled ? styles.filled : styles.empty]}
      >
        {isFilled ? '❤️' : '🖤'}
      </Text>
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.heartsRow}>{hearts}</View>
      <Text style={styles.mistakeText}>
        {mistakes > 0 ? `${mistakes} mistake${mistakes > 1 ? 's' : ''}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heart: {
    fontSize: 18,
  },
  filled: {
    opacity: 1,
  },
  empty: {
    opacity: 0.4,
  },
  mistakeText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'System',
  },
});

export default LivesDisplay;
