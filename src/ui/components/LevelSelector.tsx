import React from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Difficulty } from '../../core/types';
import { useTheme } from '../hooks/useTheme';

interface LevelSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectLevel: (difficulty: Difficulty) => void;
}

const LEVELS: {
  difficulty: Difficulty;
  label: string;
  description: string;
}[] = [
  {
    difficulty: Difficulty.EASY,
    label: 'Easy',
    description: 'Perfect for beginners',
  },
  {
    difficulty: Difficulty.MEDIUM,
    label: 'Medium',
    description: 'A bit more challenging',
  },
  {
    difficulty: Difficulty.HARD,
    label: 'Hard',
    description: 'For experienced players',
  },
  {
    difficulty: Difficulty.EXPERT,
    label: 'Expert',
    description: 'Ultimate challenge',
  },
  {
    difficulty: Difficulty.MASTER,
    label: 'Master',
    description: 'The final frontier',
  },
];

/**
 * Level selector drawer — newspaper styled, themed.
 */
export const LevelSelector: React.FC<LevelSelectorProps> = ({
  visible,
  onClose,
  onSelectLevel,
}) => {
  const theme = useTheme();
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  const handleSelect = (difficulty: Difficulty) => {
    onSelectLevel(difficulty);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.bg,
            borderTopColor: theme.border,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View
            style={[styles.handle, { backgroundColor: theme.borderLight }]}
          />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Select Difficulty
        </Text>

        <View style={styles.levelsContainer}>
          {LEVELS.map((level) => (
            <Pressable
              key={level.difficulty}
              style={({ pressed }) => [
                styles.levelButton,
                {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.borderLight,
                },
                pressed && {
                  backgroundColor: theme.borderLight,
                  transform: [{ scale: 0.98 }],
                },
              ]}
              onPress={() => handleSelect(level.difficulty)}
            >
              <View style={styles.levelContent}>
                <Text style={[styles.levelLabel, { color: theme.text }]}>
                  {level.label}
                </Text>
                <Text
                  style={[styles.levelDescription, { color: theme.textMuted }]}
                >
                  {level.description}
                </Text>
              </View>
              <Text style={[styles.arrow, { color: theme.textMuted }]}>→</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={[styles.cancelText, { color: theme.textMuted }]}>
            Cancel
          </Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 20, 16, 0.5)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  levelsContainer: {
    gap: 10,
  },
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 4,
    borderWidth: 1,
    borderBottomWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  levelContent: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 2,
  },
  levelDescription: {
    fontSize: 13,
    fontFamily: 'Lora_400Regular_Italic',
  },
  arrow: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Lora_400Regular',
  },
});

export default LevelSelector;
