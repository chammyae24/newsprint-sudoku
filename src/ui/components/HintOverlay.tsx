import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import type { TechniqueResult } from '../../core/types';
import { useGameStore } from '../../store/GameStore';

/**
 * Generate step-by-step guidance for a technique.
 */
function generateHintSteps(hint: TechniqueResult): string[] {
  const steps: string[] = [];

  // Step 1: Identify the pattern
  if (hint.primaryCells.length > 0) {
    const cellNames = hint.primaryCells
      .map((c) => `R${c.row + 1}C${c.col + 1}`)
      .join(', ');
    steps.push(`Look at the highlighted cells: ${cellNames}`);
  }

  // Step 2: Explain the logic
  steps.push(hint.explanation);

  // Step 3: What to do
  if (hint.placement) {
    steps.push(
      `Place ${hint.placement.value} in R${hint.placement.row + 1}C${hint.placement.col + 1}`
    );
  } else if (hint.eliminations.length > 0) {
    const elimStr = hint.eliminations
      .slice(0, 3)
      .map((e) => `${e.value} from R${e.row + 1}C${e.col + 1}`)
      .join(', ');
    const more =
      hint.eliminations.length > 3
        ? ` (+${hint.eliminations.length - 3} more)`
        : '';
    steps.push(`Remove candidates: ${elimStr}${more}`);
  }

  return steps;
}

export function HintOverlay() {
  const activeHint = useGameStore((state) => state.activeHint);
  const clearHint = useGameStore((state) => state.clearHint);
  const applyHint = useGameStore((state) => state.applyHint);

  const [currentStep, setCurrentStep] = useState(0);

  if (!activeHint) return null;

  const steps = generateHintSteps(activeHint);
  const isLastStep = currentStep >= steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      applyHint();
      setCurrentStep(0);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleDismiss = () => {
    clearHint();
    setCurrentStep(0);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!activeHint}
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-3xl bg-white p-6 pb-10 shadow-xl">
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">
              💡 {activeHint.technique}
            </Text>
            <Pressable onPress={handleDismiss} className="p-2">
              <Text className="text-lg text-gray-500">✕</Text>
            </Pressable>
          </View>

          {/* Step Indicator */}
          <View className="mb-4 flex-row items-center gap-2">
            {steps.map((_, idx) => (
              <View
                key={idx}
                className={`h-2 flex-1 rounded-full ${idx <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}`}
              />
            ))}
          </View>

          {/* Current Step Text */}
          <Text className="mb-6 min-h-[60px] text-base leading-6 text-gray-700">
            {steps[currentStep]}
          </Text>

          {/* Actions */}
          <View className="flex-row gap-4">
            <Pressable
              className="flex-1 items-center rounded-xl bg-gray-200 py-3"
              onPress={handleDismiss}
            >
              <Text className="font-semibold text-gray-700">Dismiss</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl bg-blue-600 py-3"
              onPress={handleNext}
            >
              <Text className="font-semibold text-white">
                {isLastStep ? 'Apply' : 'Next →'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
