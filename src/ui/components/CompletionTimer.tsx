import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useGameStore } from '../../store/GameStore';
import { useTheme } from '../hooks/useTheme';

export function CompletionTimer() {
  const theme = useTheme();
  const gameCompletionPending = useGameStore(
    (state) => state.gameCompletionPending
  );
  const completionTimerSeconds = useGameStore(
    (state) => state.completionTimerSeconds
  );
  const tickCompletionTimer = useGameStore(
    (state) => state.tickCompletionTimer
  );
  const cancelGameCompletion = useGameStore(
    (state) => state.cancelGameCompletion
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
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.accent,
            borderColor: theme.accent + '80',
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.accentText }]}>
          Finishing in...
        </Text>
        <Text style={[styles.timer, { color: theme.accentText }]}>
          {completionTimerSeconds}
        </Text>
        <Text style={[styles.subtitle, { color: theme.accentText + 'CC' }]}>
          Draw to correct!
        </Text>
        <Pressable
          style={[styles.dismissBtn, { borderColor: theme.accentText + '40' }]}
          onPress={cancelGameCompletion}
        >
          <Text style={[styles.dismissText, { color: theme.accentText }]}>
            ✕ Dismiss
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
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
  },
  title: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 16,
    marginBottom: 4,
  },
  timer: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    marginVertical: 4,
  },
  subtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
  },
  dismissBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  dismissText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 12,
  },
});
