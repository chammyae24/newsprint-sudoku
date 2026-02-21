import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

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
 * Popover for selecting a digit when OCR confidence is low — themed.
 */
export function InkChooser({
  visible,
  candidates,
  onSelect,
  onDismiss,
}: InkChooserProps) {
  const theme = useTheme();

  const handleSelect = async (digit: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(digit);
  };

  const sortedCandidates = [...candidates].sort(
    (a, b) => b.confidence - a.confidence
  );

  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 0.8)
      return {
        borderColor: theme.success,
        backgroundColor: theme.success + '20',
      };
    if (confidence >= 0.5)
      return {
        borderColor: theme.accent,
        backgroundColor: theme.accent + '20',
      };
    return { borderColor: theme.error, backgroundColor: theme.error + '20' };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.title, { color: theme.textMuted }]}>
            Did you write...
          </Text>

          <View style={styles.candidatesRow}>
            {sortedCandidates.map(({ digit, confidence }) => {
              const confStyle = getConfidenceStyle(confidence);
              return (
                <Pressable
                  key={digit}
                  style={[styles.candidate, confStyle]}
                  onPress={() => handleSelect(digit)}
                >
                  <Text style={[styles.candidateDigit, { color: theme.text }]}>
                    {digit}
                  </Text>
                  <Text
                    style={[
                      styles.candidateConfidence,
                      { color: theme.textMuted },
                    ]}
                  >
                    {Math.round(confidence * 100)}%
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.cancelButton} onPress={onDismiss}>
            <Text style={[styles.cancelText, { color: theme.textMuted }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 20, 16, 0.4)',
  },
  card: {
    marginHorizontal: 40,
    alignItems: 'center',
    borderRadius: 8,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    marginBottom: 16,
  },
  candidatesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  candidate: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 2,
    paddingVertical: 10,
  },
  candidateDigit: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
  },
  candidateConfidence: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
  },
});
