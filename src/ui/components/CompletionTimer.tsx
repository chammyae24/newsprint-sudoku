import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useGameStore } from '../../store/GameStore';

export function CompletionTimer() {
  const gameCompletionPending = useGameStore(
    (state) => state.gameCompletionPending
  );
  const completionTimerSeconds = useGameStore(
    (state) => state.completionTimerSeconds
  );
  const tickCompletionTimer = useGameStore(
    (state) => state.tickCompletionTimer
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameCompletionPending) {
      interval = setInterval(() => {
        tickCompletionTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameCompletionPending, tickCompletionTimer]);

  if (!gameCompletionPending) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      exiting={FadeOutUp}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Game Finishing...</Text>
        <Text style={styles.timer}>{completionTimerSeconds}</Text>
        <Text style={styles.subtitle}>Draw to correct!</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100, // Positioned below header
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none', // Let touches pass through to grid? Actually we might want touches for cancel button if we had one. But for now, just overlay.
  },
  card: {
    backgroundColor: '#A02020',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#7A1515',
  },
  title: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 16,
    color: '#F5EDE0',
    marginBottom: 4,
  },
  timer: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: '#F5EDE0',
    marginVertical: 4,
  },
  subtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: 'rgba(245, 237, 224, 0.8)',
  },
});
