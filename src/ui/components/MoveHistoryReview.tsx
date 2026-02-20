import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { MoveRecord } from '../../core/types';
import {
  TECHNIQUE_CATEGORIES,
  TechniqueCategory,
  TechniqueType,
} from '../../core/types';
import { useGameStore } from '../../store/GameStore';
import { captureView } from '../../utils/imageCapture';
import { StaticBoard } from './StaticBoard';

interface MoveHistoryReviewProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Get colors for technique category badges — newsprint palette
 */
const getCategoryStyle = (category: TechniqueCategory) => {
  switch (category) {
    case TechniqueCategory.BASIC:
      return { bg: '#EDE3D0', text: '#8B7355', border: '#D4C5A8' };
    case TechniqueCategory.INTERMEDIATE:
      return { bg: '#E0D5BF', text: '#6B5540', border: '#C4B08A' };
    case TechniqueCategory.ADVANCED:
      return { bg: '#D4C5A8', text: '#4A3828', border: '#B09A6E' };
  }
};

/**
 * Displays game statistics and move history — newsprint styled.
 */
export function MoveHistoryReview({
  visible,
  onClose,
}: MoveHistoryReviewProps) {
  const moveHistory = useGameStore((state) => state.moveHistory);
  const elapsedSeconds = useGameStore((state) => state.elapsedSeconds);
  const isGameWon = useGameStore((state) => state.isGameWon);

  const [expandedMoveIndex, setExpandedMoveIndex] = useState<number | null>(
    null
  );

  const totalMoves = moveHistory.length;
  const correctMoves = moveHistory.filter((m) => m.wasCorrect).length;
  const mistakes = totalMoves - correctMoves;
  const accuracy =
    totalMoves > 0 ? Math.round((correctMoves / totalMoves) * 100) : 0;

  const techniqueStats = {
    [TechniqueCategory.BASIC]: 0,
    [TechniqueCategory.INTERMEDIATE]: 0,
    [TechniqueCategory.ADVANCED]: 0,
  };

  moveHistory.forEach((move) => {
    if (move.technique && move.wasCorrect) {
      const category = TECHNIQUE_CATEGORIES[move.technique];
      if (category) {
        techniqueStats[category]++;
      }
    }
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMoveTime = (move: MoveRecord, index: number) => {
    if (index === 0) return '0:00';
    const firstMoveTime = moveHistory[0].timestamp;
    const diffSeconds = Math.floor((move.timestamp - firstMoveTime) / 1000);
    return formatTime(diffSeconds);
  };

  const getTechniqueCategory = (
    technique: TechniqueType
  ): TechniqueCategory => {
    return TECHNIQUE_CATEGORIES[technique] || TechniqueCategory.BASIC;
  };

  const viewShotRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await captureView(viewShotRef);
        if (Platform.OS === 'web') {
          // Allow sharing on web if supported, else fallback to alerting/downloading
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            try {
              await Sharing.shareAsync(uri);
              return;
            } catch (e) {
              // Ignore failure, fall back to alert
            }
          }
          Alert.alert(
            'Not Supported',
            'Native sharing might not be available on web in this browser. Try downloading the image instead.'
          );
          return;
        }

        const isAvailableNative = await Sharing.isAvailableAsync();
        if (isAvailableNative) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Failed to share', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const handleDownload = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await captureView(viewShotRef);

        if (Platform.OS === 'web') {
          // For web workaround, view-shot returns base64 or blob URI
          const link = document.createElement('a');
          link.href = uri;
          link.download = 'sudoku-victory.png';
          link.click();
        } else {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permission needed',
              'Please grant permission to save photos'
            );
            return;
          }
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Success', 'Saved to your photos!');
        }
      }
    } catch (error) {
      console.error('Failed to save', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View
              ref={viewShotRef}
              collapsable={false}
              style={{ backgroundColor: '#F5EDE0', paddingBottom: 16 }} // Ensure background matches modal
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <Text style={styles.headerTitle}>
                    {isGameWon ? '📰 Victory Edition' : '📊 Game Summary'}
                  </Text>
                  {!isGameWon && (
                    <Pressable onPress={onClose} style={styles.closeButton}>
                      <Text style={styles.closeText}>✕</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Statistics */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatTime(elapsedSeconds)}
                  </Text>
                  <Text style={styles.statLabel}>Time</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{accuracy}%</Text>
                  <Text style={styles.statLabel}>Accuracy</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalMoves}</Text>
                  <Text style={styles.statLabel}>Moves</Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[
                      styles.statValue,
                      mistakes > 0 && { color: '#A02020' },
                    ]}
                  >
                    {mistakes}
                  </Text>
                  <Text style={styles.statLabel}>Errors</Text>
                </View>
              </View>

              {/* Board for Winning state */}
              {isGameWon && (
                <View style={styles.boardSection}>
                  <StaticBoard />
                </View>
              )}

              {/* Technique Stats */}
              <View style={styles.techniqueSection}>
                <Text style={styles.techniqueTitle}>Techniques Used</Text>
                <View style={styles.techniqueRow}>
                  <View style={styles.techniqueItem}>
                    <View
                      style={[styles.dot, { backgroundColor: '#B09A6E' }]}
                    />
                    <Text style={styles.techniqueText}>
                      Basic: {techniqueStats[TechniqueCategory.BASIC]}
                    </Text>
                  </View>
                  <View style={styles.techniqueItem}>
                    <View
                      style={[styles.dot, { backgroundColor: '#8B7355' }]}
                    />
                    <Text style={styles.techniqueText}>
                      Intermediate:{' '}
                      {techniqueStats[TechniqueCategory.INTERMEDIATE]}
                    </Text>
                  </View>
                  <View style={styles.techniqueItem}>
                    <View
                      style={[styles.dot, { backgroundColor: '#4A3828' }]}
                    />
                    <Text style={styles.techniqueText}>
                      Advanced: {techniqueStats[TechniqueCategory.ADVANCED]}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions for Win State */}
            {isGameWon && (
              <View style={styles.actionSection}>
                <Pressable style={styles.actionBtn} onPress={handleShare}>
                  <Text style={styles.actionBtnText}>🔗 Share</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={handleDownload}>
                  <Text style={styles.actionBtnText}>💾 Save Image</Text>
                </Pressable>
              </View>
            )}

            {/* Move History */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Move History</Text>
              <View style={styles.historyList}>
                {moveHistory.length === 0 ? (
                  <Text style={styles.emptyText}>No moves recorded</Text>
                ) : (
                  moveHistory.map((move, index) => {
                    const category = move.technique
                      ? getTechniqueCategory(move.technique)
                      : null;
                    const catStyle = category
                      ? getCategoryStyle(category)
                      : null;
                    const isExpanded = expandedMoveIndex === index;

                    return (
                      <Pressable
                        key={index}
                        onPress={() =>
                          setExpandedMoveIndex(isExpanded ? null : index)
                        }
                      >
                        <View
                          style={[
                            styles.moveItem,
                            {
                              backgroundColor: move.wasCorrect
                                ? '#EDE3D0'
                                : 'rgba(160, 32, 32, 0.08)',
                            },
                          ]}
                        >
                          <View style={styles.moveRow}>
                            {/* Move number */}
                            <View style={styles.moveNumber}>
                              <Text style={styles.moveNumberText}>
                                {index + 1}
                              </Text>
                            </View>

                            {/* Move details */}
                            <View style={styles.moveDetails}>
                              <Text style={styles.moveText}>
                                {move.type === 'elimination' ? (
                                  <>
                                    Removed Note{' '}
                                    <Text style={styles.moveValueElim}>
                                      {move.value}
                                    </Text>
                                  </>
                                ) : (
                                  <>
                                    Placed{' '}
                                    <Text style={styles.moveValue}>
                                      {move.value}
                                    </Text>
                                  </>
                                )}{' '}
                                at R{move.row + 1}C{move.col + 1}
                              </Text>
                              {move.technique && catStyle && (
                                <View style={styles.badgeContainer}>
                                  <View
                                    style={[
                                      styles.badge,
                                      { backgroundColor: catStyle.bg },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.badgeText,
                                        { color: catStyle.text },
                                      ]}
                                    >
                                      {move.technique}
                                    </Text>
                                  </View>
                                </View>
                              )}
                            </View>

                            {/* Time & status */}
                            <View style={styles.moveStatus}>
                              <Text style={styles.moveTime}>
                                {formatMoveTime(move, index)}
                              </Text>
                              <Text
                                style={[
                                  styles.moveResult,
                                  {
                                    color: move.wasCorrect
                                      ? '#4A7A4A'
                                      : '#A02020',
                                  },
                                ]}
                              >
                                {move.wasCorrect ? '✓' : '✗'}
                              </Text>
                            </View>
                          </View>

                          {/* Expanded explanation */}
                          {isExpanded && move.techniqueExplanation && (
                            <View style={styles.explanation}>
                              <Text style={styles.explanationText}>
                                {move.techniqueExplanation}
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          </ScrollView>

          {/* Close button at bottom */}
          <View style={styles.footer}>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
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
    backgroundColor: 'rgba(26, 20, 16, 0.6)',
  },
  modal: {
    flex: 1,
    marginTop: 80,
    backgroundColor: '#F5EDE0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 3,
    borderTopColor: '#2A2118',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D4C5A8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: '#2A2118',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#8B7355',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D4C5A8',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: '#2A2118',
  },
  statLabel: {
    fontFamily: 'Lora_400Regular',
    fontSize: 11,
    color: '#8B7355',
    marginTop: 2,
  },

  // Technique stats
  techniqueSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#D4C5A8',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  techniqueTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    color: '#3A2A1C',
    marginBottom: 8,
  },
  techniqueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  techniqueItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  techniqueText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 11,
    color: '#6B5540',
  },

  // Board
  boardSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#D4C5A8',
  },

  // Actions
  actionSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D4C5A8',
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#EDE3D0',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4B08A',
  },
  actionBtnText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    color: '#4A3828',
  },

  // Move history
  historySection: {
    padding: 16,
  },
  historyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#2A2118',
    marginBottom: 12,
  },
  historyList: {
    paddingBottom: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    paddingVertical: 32,
  },
  moveItem: {
    marginBottom: 8,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D4C5A8',
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4C5A8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  moveNumberText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 12,
    color: '#4A3828',
  },
  moveDetails: {
    flex: 1,
  },
  moveText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 13,
    color: '#3A2A1C',
  },
  moveValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#4A3828',
  },
  moveValueElim: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: '#A02020',
    textDecorationLine: 'line-through',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
  },
  moveStatus: {
    alignItems: 'flex-end',
  },
  moveTime: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
    color: '#B09A6E',
  },
  moveResult: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    marginTop: 2,
  },
  explanation: {
    marginTop: 8,
    backgroundColor: 'rgba(245, 237, 224, 0.8)',
    borderRadius: 4,
    padding: 8,
  },
  explanationText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 12,
    color: '#6B5540',
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#D4C5A8',
    padding: 20,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: '#4A3828',
    borderRadius: 6,
    paddingVertical: 16,
  },
  closeBtnText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: '#F5EDE0',
  },
});
