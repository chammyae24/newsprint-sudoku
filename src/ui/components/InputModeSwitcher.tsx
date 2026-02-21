import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { InputMode, useGameStore } from '../../store/GameStore';
import { useTheme } from '../hooks/useTheme';

/**
 * Input mode switcher — Solve Pen / Note Pencil with stamp icons.
 */
export function InputModeSwitcher() {
  const theme = useTheme();
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
          inputMode === 'solve' && [
            styles.modeButtonActive,
            { backgroundColor: theme.text + '10' },
          ],
        ]}
        onPress={() => handleModeChange('solve')}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.stampIcon,
              { backgroundColor: theme.borderLight },
              inputMode === 'solve' && { backgroundColor: theme.buttonBg },
            ]}
          >
            <Text style={styles.stampIconText}>✒️</Text>
          </View>
        </View>
        <Text
          style={[
            styles.modeLabel,
            { color: theme.textMuted },
            inputMode === 'solve' && [
              styles.modeLabelActive,
              { color: theme.text },
            ],
          ]}
        >
          SOLVE{'\n'}PEN
        </Text>
      </Pressable>

      {/* Note Pencil */}
      <Pressable
        style={[
          styles.modeButton,
          inputMode === 'note' && [
            styles.modeButtonActive,
            { backgroundColor: theme.text + '10' },
          ],
        ]}
        onPress={() => handleModeChange('note')}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.stampIcon,
              { backgroundColor: theme.borderLight },
              inputMode === 'note' && { backgroundColor: theme.buttonBg },
            ]}
          >
            <Text style={styles.stampIconText}>📝</Text>
          </View>
        </View>
        <Text
          style={[
            styles.modeLabel,
            { color: theme.textMuted },
            inputMode === 'note' && [
              styles.modeLabelActive,
              { color: theme.text },
            ],
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
  },
  iconContainer: {
    marginBottom: 4,
  },
  stampIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampIconText: {
    fontSize: 20,
  },
  modeLabel: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  modeLabelActive: {
    fontWeight: '700',
  },
});
