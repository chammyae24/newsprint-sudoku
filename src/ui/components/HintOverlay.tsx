import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TechniqueResult } from '../../core/types';
import { useGameStore } from '../../store/GameStore';

function generateHintSteps(hint: TechniqueResult): string[] {
  const steps: string[] = [];
  if (hint.primaryCells.length > 0) {
    const cellNames = hint.primaryCells
      .map((c) => `R${c.row + 1}C${c.col + 1}`)
      .join(', ');
    steps.push(`Look at the highlighted cells: ${cellNames}`);
  }
  steps.push(hint.explanation);
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
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔍 {activeHint.technique}</Text>
            <Pressable onPress={handleDismiss} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {steps.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.stepDot,
                  idx <= currentStep && styles.stepDotActive,
                ]}
              />
            ))}
          </View>

          {/* Current Step */}
          <Text style={styles.stepText}>{steps[currentStep]}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextText}>
                {isLastStep ? 'Apply' : 'Next →'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26, 20, 16, 0.5)',
  },
  content: {
    backgroundColor: '#F5EDE0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 36,
    borderTopWidth: 3,
    borderTopColor: '#2A2118',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: '#2A2118',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#8B7355',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4C5A8',
  },
  stepDotActive: {
    backgroundColor: '#4A3828',
  },
  stepText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#3A2A1C',
    marginBottom: 24,
    minHeight: 60,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#EDE3D0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4C5A8',
  },
  dismissText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 15,
    color: '#8B7355',
  },
  nextButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#4A3828',
    borderRadius: 6,
  },
  nextText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 15,
    color: '#F5EDE0',
  },
});
