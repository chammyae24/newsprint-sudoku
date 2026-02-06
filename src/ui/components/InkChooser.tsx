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
  const sortedCandidates = [...candidates].sort((a, b) => b.confidence - a.confidence);
  
  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 0.8) return styles.highConfidence;
    if (confidence >= 0.5) return styles.mediumConfidence;
    return styles.lowConfidence;
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>Did you write...</Text>
          
          <View style={styles.candidatesRow}>
            {sortedCandidates.map(({ digit, confidence }) => (
              <Pressable
                key={digit}
                style={[styles.candidateButton, getConfidenceStyle(confidence)]}
                onPress={() => handleSelect(digit)}
              >
                <Text style={styles.digitText}>{digit}</Text>
                <Text style={styles.confidenceText}>
                  {Math.round(confidence * 100)}%
                </Text>
              </Pressable>
            ))}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 16,
  },
  candidatesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  candidateButton: {
    width: 64,
    height: 72,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  highConfidence: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  mediumConfidence: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  lowConfidence: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  digitText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  confidenceText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
