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
import type { Difficulty } from '../../core/types';
import type { AchievementDef } from '../../storage/achievementsStorage';

interface WinModalProps {
  visible: boolean;
  elapsedSeconds: number;
  difficulty: Difficulty;
  mistakes: number;
  currentStreak: number;
  isPersonalBest: boolean;
  newAchievements: AchievementDef[];
  onNewGame: () => void;
  onGoHome: () => void;
  onShowStats: () => void;
}

const CONFETTI_COLORS = [
  '#B09A6E',
  '#A02020',
  '#8B7355',
  '#D4C5A8',
  '#6B5540',
  '#C4B08A',
  '#edb942ff',
];
const CONFETTI_COUNT = 50;

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
  EXPERT: 'Expert',
  MASTER: 'Master',
};

/**
 * Victory modal — "EXTRA EXTRA" newspaper headline style
 * with streak, personal best, difficulty, and achievement callouts.
 */
export const WinModal: React.FC<WinModalProps> = ({
  visible,
  elapsedSeconds,
  difficulty,
  mistakes,
  currentStreak,
  isPersonalBest,
  newAchievements,
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      confettiAnims.forEach((anim) => {
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
            <Text style={styles.extraExtra}>EXTRA! EXTRA!</Text>

            {/* Difficulty badge */}
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                {DIFFICULTY_LABELS[difficulty] || difficulty}
              </Text>
            </View>

            <View style={styles.headline}>
              <Text style={styles.headlineText}>PUZZLE SOLVED!</Text>
            </View>

            <Text style={styles.subtitle}>
              Completed in {formatTime(elapsedSeconds)}
            </Text>

            {/* Callouts row */}
            <View style={styles.calloutsRow}>
              {/* Perfect game */}
              {mistakes === 0 && (
                <View style={styles.calloutBadge}>
                  <Text style={styles.calloutText}>⭐ Flawless!</Text>
                </View>
              )}

              {/* Personal best */}
              {isPersonalBest && (
                <View style={[styles.calloutBadge, styles.calloutBest]}>
                  <Text style={styles.calloutText}>🏅 Personal Best!</Text>
                </View>
              )}
            </View>

            {/* Streak */}
            {currentStreak >= 2 && (
              <View style={styles.streakContainer}>
                <Text style={styles.streakText}>
                  🔥 {currentStreak} wins in a row!
                </Text>
              </View>
            )}

            {/* Newly unlocked achievements */}
            {newAchievements.length > 0 && (
              <View style={styles.achievementsContainer}>
                <Text style={styles.achievementsLabel}>
                  🏆 ACHIEVEMENTS UNLOCKED
                </Text>
                {newAchievements.map((a) => (
                  <View key={a.id} style={styles.achievementRow}>
                    <Text style={styles.achievementIcon}>{a.icon}</Text>
                    <View style={styles.achievementTextCol}>
                      <Text style={styles.achievementTitle}>{a.title}</Text>
                      <Text style={styles.achievementDesc}>
                        {a.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.buttons}>
              <Pressable style={styles.statsButton} onPress={onShowStats}>
                <Text style={styles.statsButtonText}>📊 View Stats</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={onNewGame}>
                <Text style={styles.primaryButtonText}>New Puzzle</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={onGoHome}>
                <Text style={styles.secondaryButtonText}>Return Home</Text>
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
    backgroundColor: 'rgba(26, 20, 16, 0.7)',
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
    backgroundColor: '#F5EDE0',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2A2118',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    maxWidth: 340,
  },
  extraExtra: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 16,
    color: '#A02020',
    letterSpacing: 4,
    marginBottom: 8,
  },
  difficultyBadge: {
    backgroundColor: '#2A2118',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  difficultyText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 11,
    color: '#edb942ff',
    letterSpacing: 1,
  },
  headline: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#2A2118',
    paddingVertical: 8,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  headlineText: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 28,
    color: '#2A2118',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: '#8B7355',
    marginBottom: 6,
  },

  // Callouts
  calloutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  calloutBadge: {
    backgroundColor: '#FDF0C8',
    borderWidth: 1,
    borderColor: '#edb942ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calloutBest: {
    backgroundColor: '#E8F0E8',
    borderColor: '#5A9A5A',
  },
  calloutText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 11,
    color: '#2A2118',
  },

  // Streak
  streakContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  streakText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    color: '#A02020',
    textAlign: 'center',
  },

  // Achievements
  achievementsContainer: {
    width: '100%',
    marginTop: 8,
    backgroundColor: '#2A2118',
    borderRadius: 6,
    padding: 10,
  },
  achievementsLabel: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 9,
    color: '#edb942ff',
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  achievementTextCol: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: '#F5EDE0',
  },
  achievementDesc: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 10,
    color: '#D4C5A8',
  },

  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#C4B08A',
    marginVertical: 12,
  },
  buttons: {
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#4A3828',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#F5EDE0',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#EDE3D0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4C5A8',
  },
  secondaryButtonText: {
    fontFamily: 'Lora_400Regular',
    color: '#8B7355',
    fontSize: 16,
  },
  statsButton: {
    backgroundColor: '#6B5540',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    alignItems: 'center',
  },
  statsButtonText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#F5EDE0',
    fontSize: 16,
  },
});

export default WinModal;
