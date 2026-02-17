import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InputMode, useGameStore } from '../../store/GameStore';

/**
 * Input mode switcher — Solve Pen / Note Pencil with stamp icons.
 */
export function InputModeSwitcher() {
  const inputMode = useGameStore((state) => state.inputMode);
  const setInputMode = useGameStore((state) => state.setInputMode);

  const handleModeChange = async (mode: InputMode) => {
    if (inputMode !== mode) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setInputMode(mode);
    }
  };

  return (
    <View style={styles.container}>
      {/* Solve Pen */}
      <Pressable
        style={[
          styles.modeButton,
          inputMode === 'solve' && styles.modeButtonActive,
        ]}
        onPress={() => handleModeChange('solve')}
      >
        {/* Ink stamp icon representation */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.stampIcon,
              inputMode === 'solve' && styles.stampIconActive,
            ]}
          >
            <Text style={styles.stampIconText}>✒️</Text>
          </View>
        </View>
        <Text
          style={[
            styles.modeLabel,
            inputMode === 'solve' && styles.modeLabelActive,
          ]}
        >
          SOLVE{'\n'}PEN
        </Text>
      </Pressable>

      {/* Note Pencil */}
      <Pressable
        style={[
          styles.modeButton,
          inputMode === 'note' && styles.modeButtonActive,
        ]}
        onPress={() => handleModeChange('note')}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.stampIcon,
              inputMode === 'note' && styles.stampIconActive,
            ]}
          >
            <Text style={styles.stampIconText}>📝</Text>
          </View>
        </View>
        <Text
          style={[
            styles.modeLabel,
            inputMode === 'note' && styles.modeLabelActive,
          ]}
        >
          NOTE{'\n'}PENCIL
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  modeButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 72,
    opacity: 0.6,
  },
  modeButtonActive: {
    opacity: 1,
    backgroundColor: 'rgba(42, 33, 24, 0.08)',
  },
  iconContainer: {
    marginBottom: 4,
  },
  stampIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#D4C5A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampIconActive: {
    backgroundColor: '#4A3828',
  },
  stampIconText: {
    fontSize: 20,
  },
  modeLabel: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 13,
  },
  modeLabelActive: {
    color: '#2A2118',
    fontWeight: '700',
  },
});
