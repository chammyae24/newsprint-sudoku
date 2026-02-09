import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface WinModalProps {
  visible: boolean;
  elapsedSeconds: number;
  onNewGame: () => void;
  onGoHome: () => void;
  onShowStats: () => void;
}

const CONFETTI_COLORS = [
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
];
const CONFETTI_COUNT = 50;

/**
 * Victory modal with confetti animation.
 */
export const WinModal: React.FC<WinModalProps> = ({
  visible,
  elapsedSeconds,
  onNewGame,
  onGoHome,
  onShowStats,
}) => {
  const confettiAnims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(Math.random() * 300 - 150),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Scale in the modal
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Animate confetti
      confettiAnims.forEach((anim, i) => {
        anim.translateY.setValue(-50);
        anim.opacity.setValue(1);

        const delay = Math.random() * 500;
        const duration = 2000 + Math.random() * 1000;

        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: 500 + Math.random() * 200,
            duration,
            delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration,
            delay: delay + duration - 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, confettiAnims, scaleAnim]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          {/* Confetti */}
          {confettiAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  left: `${Math.random() * 100}%`,
                  transform: [
                    { translateY: anim.translateY },
                    { translateX: anim.translateX },
                    {
                      rotate: anim.rotate.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            />
          ))}

          {/* Modal content */}
          <Animated.View
            style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}
          >
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>You Won!</Text>
            <Text style={styles.subtitle}>Congratulations!</Text>
            <Text style={styles.time}>Time: {formatTime(elapsedSeconds)}</Text>

            <View style={styles.buttons}>
              <Pressable style={styles.statsButton} onPress={onShowStats}>
                <Text style={styles.statsButtonText}>📊 View Stats</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={onNewGame}>
                <Text style={styles.primaryButtonText}>New Game</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onGoHome}>
                <Text style={styles.secondaryButtonText}>Go Home</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 20,
    borderRadius: 2,
    top: -50,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  time: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 24,
  },
  buttons: {
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  statsButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WinModal;
