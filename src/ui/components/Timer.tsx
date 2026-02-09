import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useGameStore } from '../../store/GameStore';

/**
 * Timer component that displays elapsed time and allows pause/resume.
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

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/stop timer based on game state
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
    <TouchableOpacity onPress={handleTogglePause} style={styles.container}>
      <Text style={styles.icon}>{isPaused ? '▶️' : '⏸️'}</Text>
      <Text style={styles.time}>{formatTime(elapsedSeconds)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  icon: {
    fontSize: 16,
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: '#2A2A2A',
    fontFamily: 'System',
  },
});

export default Timer;
