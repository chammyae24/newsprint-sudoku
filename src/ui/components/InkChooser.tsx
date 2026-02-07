import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { cn } from '../../utils/cn';

interface Candidate {
  digit: number;
  confidence: number;
}

interface InkChooserProps {
  /** Whether the chooser is visible */
  visible: boolean;
  /** Candidate digits from OCR with confidence scores */
  candidates: Candidate[];
  /** Called when a digit is selected */
  onSelect: (digit: number) => void;
  /** Called when the chooser is dismissed */
  onDismiss: () => void;
}

/**
 * Popover for selecting a digit when OCR confidence is low.
 * Shows candidate digits with visual confidence indicators.
 */
export function InkChooser({
  visible,
  candidates,
  onSelect,
  onDismiss,
}: InkChooserProps) {
  const handleSelect = async (digit: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(digit);
  };

  // Sort by confidence (highest first)
  const sortedCandidates = [...candidates].sort(
    (a, b) => b.confidence - a.confidence
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/40"
        onPress={onDismiss}
      >
        <View className="mx-10 items-center rounded-2xl bg-white p-5 shadow-lg">
          <Text className="mb-4 text-base font-medium text-gray-600">
            Did you write...
          </Text>

          <View className="mb-4 flex-row gap-3">
            {sortedCandidates.map(({ digit, confidence }) => (
              <Pressable
                key={digit}
                className={cn(
                  'h-18 w-16 items-center justify-center rounded-xl border py-2',
                  confidence >= 0.8 && 'border-2 border-green-500 bg-green-100',
                  confidence >= 0.5 &&
                    confidence < 0.8 &&
                    'border-amber-500 bg-amber-100',
                  confidence < 0.5 && 'border-red-500 bg-red-100'
                )}
                onPress={() => handleSelect(digit)}
              >
                <Text className="text-2xl font-bold text-gray-800">
                  {digit}
                </Text>
                <Text className="mt-0.5 text-[11px] text-gray-500">
                  {Math.round(confidence * 100)}%
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable className="px-6 py-2.5" onPress={onDismiss}>
            <Text className="text-sm text-gray-500">Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
