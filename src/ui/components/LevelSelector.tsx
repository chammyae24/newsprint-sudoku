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

interface LevelSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectLevel: (difficulty: Difficulty) => void;
}

const LEVELS: {
  difficulty: Difficulty;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    difficulty: Difficulty.EASY,
    label: 'Easy',
    description: 'Perfect for beginners',
    color: '#10B981',
  },
  {
    difficulty: Difficulty.MEDIUM,
    label: 'Medium',
    description: 'A bit more challenging',
    color: '#F59E0B',
  },
  {
    difficulty: Difficulty.HARD,
    label: 'Hard',
    description: 'For experienced players',
    color: '#EF4444',
  },
  {
    difficulty: Difficulty.EXPERT,
    label: 'Expert',
    description: 'Ultimate challenge',
    color: '#7C3AED',
  },
  {
    difficulty: Difficulty.MASTER,
    label: 'Master',
    description: 'Ultimate challenge',
    color: '#7C3AED',
  },
];

/**
 * Bottom drawer component for selecting difficulty level.
 */
export const LevelSelector: React.FC<LevelSelectorProps> = ({
  visible,
  onClose,
  onSelectLevel,
}) => {
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
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      {/* Drawer */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Select Difficulty</Text>

        {/* Level Options */}
        <View style={styles.levelsContainer}>
          {LEVELS.map((level) => (
            <Pressable
              key={level.difficulty}
              style={[styles.levelButton, { borderLeftColor: level.color }]}
              onPress={() => handleSelect(level.difficulty)}
            >
              <View style={styles.levelContent}>
                <Text style={styles.levelLabel}>{level.label}</Text>
                <Text style={styles.levelDescription}>{level.description}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))}
        </View>

        {/* Cancel */}
        <Pressable style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  levelsContainer: {
    gap: 12,
  },
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  levelContent: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  levelDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  arrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default LevelSelector;
