import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface LoseModalProps {
  visible: boolean;
  onNewGame: () => void;
  onGoHome: () => void;
  onShowStats: () => void;
}

/**
 * Game over modal — newspaper styled, themed.
 */
export const LoseModal: React.FC<LoseModalProps> = ({
  visible,
  onNewGame,
  onGoHome,
  onShowStats,
}) => {
  const theme = useTheme();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
    }
  }, [visible, scaleAnim, shakeAnim]);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
              },
            ]}
          >
            <Text style={[styles.stopPress, { color: theme.error }]}>
              — STOP PRESS —
            </Text>
            <View style={[styles.headline, { borderColor: theme.error }]}>
              <Text style={[styles.headlineText, { color: theme.error }]}>
                GAME OVER
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: theme.text }]}>
              You ran out of lives
            </Text>
            <Text style={[styles.encouragement, { color: theme.textMuted }]}>
              The puzzle remains unsolved... for now.
            </Text>

            <View
              style={[styles.divider, { backgroundColor: theme.borderLight }]}
            />

            <View style={styles.buttons}>
              <Pressable
                style={[
                  styles.statsButton,
                  { backgroundColor: theme.textSecondary },
                ]}
                onPress={onShowStats}
              >
                <Text
                  style={[styles.statsButtonText, { color: theme.surface }]}
                >
                  📊 View Stats
                </Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: theme.error }]}
                onPress={onNewGame}
              >
                <Text
                  style={[styles.primaryButtonText, { color: theme.surface }]}
                >
                  Try Again
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderLight,
                  },
                ]}
                onPress={onGoHome}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.textMuted },
                  ]}
                >
                  Return Home
                </Text>
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
  },
  modalContent: {
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    maxWidth: 340,
  },
  stopPress: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
    letterSpacing: 3,
    marginBottom: 8,
  },
  headline: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
    paddingVertical: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  headlineText: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
    marginBottom: 4,
  },
  encouragement: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    marginVertical: 16,
  },
  buttons: {
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
  },
  statsButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    alignItems: 'center',
  },
  statsButtonText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
  },
});

export default LoseModal;
