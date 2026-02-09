import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { InputMode, useGameStore } from '../../store/GameStore';
import { cn } from '../../utils/cn';

/**
 * Toggle between Solve and Note input modes.
 * Provides haptic feedback on mode change.
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
    <View className="flex-row items-center justify-center gap-4 py-3">
      <Pressable
        className={cn(
          'flex-row items-center gap-2 rounded-3xl px-5 py-2.5',
          inputMode === 'solve' ? 'bg-blue-800' : 'bg-gray-100'
        )}
        onPress={() => handleModeChange('solve')}
      >
        <Text className="text-lg">✏️</Text>
        <Text
          className={cn(
            'text-sm font-medium',
            inputMode === 'solve' ? 'text-white' : 'text-gray-600'
          )}
        >
          Solve
        </Text>
      </Pressable>

      <Pressable
        className={cn(
          'flex-row items-center gap-2 rounded-3xl px-5 py-2.5',
          inputMode === 'note' ? 'bg-blue-800' : 'bg-gray-100'
        )}
        onPress={() => handleModeChange('note')}
      >
        <Text className="text-lg">📝</Text>
        <Text
          className={cn(
            'text-sm font-medium',
            inputMode === 'note' ? 'text-white' : 'text-gray-600'
          )}
        >
          Notes
        </Text>
      </Pressable>
    </View>
  );
}
