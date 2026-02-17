import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';

/**
 * Timer component — torn paper strip style.
 */
export const Timer: React.FC = () => {
  const {
    elapsedSeconds,
    isPaused,
    isGameOver,
    isGameWon,
    tick,
    pause,
    resume,
  } = useGameStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isGameOver || isGameWon) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, isGameOver, isGameWon, tick]);

  const handleTogglePause = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  return (
    <Pressable onPress={handleTogglePause} style={styles.container}>
      <View style={styles.strip}>
        <Text style={styles.icon}>{isPaused ? '▶' : '⏸'}</Text>
        <Text style={styles.time}>{formatTime(elapsedSeconds)}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#EDE3D0',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D4C5A8',
    // Torn paper effect
    borderTopWidth: 1.5,
    borderBottomWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    fontSize: 12,
    color: '#8B7355',
  },
  time: {
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: '#2A2118',
    fontFamily: 'SpecialElite_400Regular',
  },
});

export default Timer;
