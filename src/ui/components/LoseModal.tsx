import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface LoseModalProps {
  visible: boolean;
  onNewGame: () => void;
  onGoHome: () => void;
  onShowStats: () => void;
}

/**
 * Game over modal — newspaper styled.
 */
export const LoseModal: React.FC<LoseModalProps> = ({
  visible,
  onNewGame,
  onGoHome,
  onShowStats,
}) => {
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
                transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
              },
            ]}
          >
            <Text style={styles.stopPress}>— STOP PRESS —</Text>
            <View style={styles.headline}>
              <Text style={styles.headlineText}>GAME OVER</Text>
            </View>
            <Text style={styles.subtitle}>You ran out of lives</Text>
            <Text style={styles.encouragement}>
              The puzzle remains unsolved... for now.
            </Text>

            <View style={styles.divider} />

            <View style={styles.buttons}>
              <Pressable style={styles.statsButton} onPress={onShowStats}>
                <Text style={styles.statsButtonText}>📊 View Stats</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={onNewGame}>
                <Text style={styles.primaryButtonText}>Try Again</Text>
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
  stopPress: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
    color: '#A02020',
    letterSpacing: 3,
    marginBottom: 8,
  },
  headline: {
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#A02020',
    paddingVertical: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  headlineText: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 28,
    color: '#A02020',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
    color: '#3A2A1C',
    marginBottom: 4,
  },
  encouragement: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#C4B08A',
    marginVertical: 16,
  },
  buttons: {
    gap: 10,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#A02020',
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

export default LoseModal;
