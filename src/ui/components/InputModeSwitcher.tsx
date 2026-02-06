import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InputMode, useGameStore } from '../../store/GameStore';

/**
 * Toggle between Solve and Note input modes.
 * Provides haptic feedback on mode change.
 */
export function InputModeSwitcher() {
  const inputMode = useGameStore(state => state.inputMode);
  const setInputMode = useGameStore(state => state.setInputMode);
  
  const handleModeChange = async (mode: InputMode) => {
    if (inputMode !== mode) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setInputMode(mode);
    }
  };
  
  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.modeButton,
          inputMode === 'solve' && styles.activeButton,
        ]}
        onPress={() => handleModeChange('solve')}
      >
        <Text style={[
          styles.modeIcon,
          inputMode === 'solve' && styles.activeIcon,
        ]}>
          ✏️
        </Text>
        <Text style={[
          styles.modeText,
          inputMode === 'solve' && styles.activeText,
        ]}>
          Solve
        </Text>
      </Pressable>
      
      <Pressable
        style={[
          styles.modeButton,
          inputMode === 'note' && styles.activeButton,
        ]}
        onPress={() => handleModeChange('note')}
      >
        <Text style={[
          styles.modeIcon,
          inputMode === 'note' && styles.activeIcon,
        ]}>
          📝
        </Text>
        <Text style={[
          styles.modeText,
          inputMode === 'note' && styles.activeText,
        ]}>
          Notes
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    gap: 8,
  },
  activeButton: {
    backgroundColor: '#1e40af',
  },
  modeIcon: {
    fontSize: 18,
  },
  activeIcon: {
    // Icon color doesn't change with emoji
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  activeText: {
    color: '#ffffff',
  },
});
