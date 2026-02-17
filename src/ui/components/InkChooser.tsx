import * as Haptics from 'expo-haptics';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

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
 * Popover for selecting a digit when OCR confidence is low — newsprint styled.
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

  const sortedCandidates = [...candidates].sort(
    (a, b) => b.confidence - a.confidence
  );

  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 0.8)
      return { borderColor: '#4A7A4A', backgroundColor: '#E8EFD0' };
    if (confidence >= 0.5)
      return { borderColor: '#B09A6E', backgroundColor: '#EDE3D0' };
    return { borderColor: '#A02020', backgroundColor: '#F0DDD0' };
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.card}>
          <Text style={styles.title}>Did you write...</Text>

          <View style={styles.candidatesRow}>
            {sortedCandidates.map(({ digit, confidence }) => {
              const confStyle = getConfidenceStyle(confidence);
              return (
                <Pressable
                  key={digit}
                  style={[styles.candidate, confStyle]}
                  onPress={() => handleSelect(digit)}
                >
                  <Text style={styles.candidateDigit}>{digit}</Text>
                  <Text style={styles.candidateConfidence}>
                    {Math.round(confidence * 100)}%
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.cancelButton} onPress={onDismiss}>
            <Text style={styles.cancelText}>Cancel</Text>
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
    backgroundColor: '#F5EDE0',
    padding: 20,
    borderWidth: 2,
    borderColor: '#2A2118',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 15,
    color: '#8B7355',
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
    color: '#2A2118',
  },
  candidateConfidence: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 11,
    color: '#8B7355',
    marginTop: 2,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    color: '#8B7355',
  },
});
