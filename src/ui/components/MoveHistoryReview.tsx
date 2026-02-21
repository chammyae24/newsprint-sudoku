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
import { useTheme } from '../hooks/useTheme';
import { StaticBoard } from './StaticBoard';

interface MoveHistoryReviewProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Displays game statistics and move history — themed newsprint styled.
 */
export function MoveHistoryReview({
  visible,
  onClose,
}: MoveHistoryReviewProps) {
  const theme = useTheme();
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

  /**
   * Category badge colors — derive from theme
   */
  const getCategoryStyle = (category: TechniqueCategory) => {
    switch (category) {
      case TechniqueCategory.BASIC:
        return {
          bg: theme.surfaceAlt,
          text: theme.textMuted,
          border: theme.borderLight,
        };
      case TechniqueCategory.INTERMEDIATE:
        return {
          bg: theme.borderLight,
          text: theme.textSecondary,
          border: theme.borderLight,
        };
      case TechniqueCategory.ADVANCED:
        return {
          bg: theme.border + '40',
          text: theme.text,
          border: theme.border,
        };
    }
  };

  const viewShotRef = useRef<View>(null);

  const handleShare = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await captureView(viewShotRef);
        if (Platform.OS === 'web') {
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
        <View
          style={[
            styles.modal,
            { backgroundColor: theme.bg, borderTopColor: theme.border },
          ]}
        >
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View
              ref={viewShotRef}
              collapsable={false}
              style={{ backgroundColor: theme.bg, paddingBottom: 16 }}
            >
              {/* Header */}
              <View
                style={[
                  styles.header,
                  { borderBottomColor: theme.borderLight },
                ]}
              >
                <View style={styles.headerRow}>
                  <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {isGameWon ? '📰 Victory Edition' : '📊 Game Summary'}
                  </Text>
                  {!isGameWon && (
                    <Pressable onPress={onClose} style={styles.closeButton}>
                      <Text
                        style={[styles.closeText, { color: theme.textMuted }]}
                      >
                        ✕
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Statistics */}
              <View
                style={[
                  styles.statsRow,
                  { borderBottomColor: theme.borderLight },
                ]}
              >
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {formatTime(elapsedSeconds)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                    Time
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {accuracy}%
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                    Accuracy
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {totalMoves}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                    Moves
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text
                    style={[
                      styles.statValue,
                      { color: theme.text },
                      mistakes > 0 && { color: theme.error },
                    ]}
                  >
                    {mistakes}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                    Errors
                  </Text>
                </View>
              </View>

              {/* Board for Winning state */}
              {isGameWon && (
                <View
                  style={[
                    styles.boardSection,
                    { borderBottomColor: theme.borderLight },
                  ]}
                >
                  <StaticBoard />
                </View>
              )}

              {/* Technique Stats */}
              <View
                style={[
                  styles.techniqueSection,
                  { borderBottomColor: theme.borderLight },
                ]}
              >
                <Text style={[styles.techniqueTitle, { color: theme.text }]}>
                  Techniques Used
                </Text>
                <View style={styles.techniqueRow}>
                  <View style={styles.techniqueItem}>
                    <View
                      style={[styles.dot, { backgroundColor: theme.accent }]}
                    />
                    <Text
                      style={[
                        styles.techniqueText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Basic: {techniqueStats[TechniqueCategory.BASIC]}
                    </Text>
                  </View>
                  <View style={styles.techniqueItem}>
                    <View
                      style={[styles.dot, { backgroundColor: theme.textMuted }]}
                    />
                    <Text
                      style={[
                        styles.techniqueText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Intermediate:{' '}
                      {techniqueStats[TechniqueCategory.INTERMEDIATE]}
                    </Text>
                  </View>
                  <View style={styles.techniqueItem}>
                    <View
                      style={[styles.dot, { backgroundColor: theme.text }]}
                    />
                    <Text
                      style={[
                        styles.techniqueText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Advanced: {techniqueStats[TechniqueCategory.ADVANCED]}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions for Win State */}
            {isGameWon && (
              <View
                style={[
                  styles.actionSection,
                  { borderBottomColor: theme.borderLight },
                ]}
              >
                <Pressable
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderLight,
                    },
                  ]}
                  onPress={handleShare}
                >
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>
                    🔗 Share
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: theme.borderLight,
                    },
                  ]}
                  onPress={handleDownload}
                >
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>
                    💾 Save Image
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Move History */}
            <View style={styles.historySection}>
              <Text style={[styles.historyTitle, { color: theme.text }]}>
                Move History
              </Text>
              <View style={styles.historyList}>
                {moveHistory.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    No moves recorded
                  </Text>
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
                                ? theme.surfaceAlt
                                : theme.error + '12',
                              borderColor: theme.borderLight,
                            },
                          ]}
                        >
                          <View style={styles.moveRow}>
                            {/* Move number */}
                            <View
                              style={[
                                styles.moveNumber,
                                { backgroundColor: theme.borderLight },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.moveNumberText,
                                  { color: theme.text },
                                ]}
                              >
                                {index + 1}
                              </Text>
                            </View>

                            {/* Move details */}
                            <View style={styles.moveDetails}>
                              <Text
                                style={[styles.moveText, { color: theme.text }]}
                              >
                                {move.type === 'elimination' ? (
                                  <>
                                    Removed Note{' '}
                                    <Text
                                      style={[
                                        styles.moveValueElim,
                                        { color: theme.error },
                                      ]}
                                    >
                                      {move.value}
                                    </Text>
                                  </>
                                ) : (
                                  <>
                                    Placed{' '}
                                    <Text
                                      style={[
                                        styles.moveValue,
                                        { color: theme.text },
                                      ]}
                                    >
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
                              <Text
                                style={[
                                  styles.moveTime,
                                  { color: theme.textMuted },
                                ]}
                              >
                                {formatMoveTime(move, index)}
                              </Text>
                              <Text
                                style={[
                                  styles.moveResult,
                                  {
                                    color: move.wasCorrect
                                      ? theme.success
                                      : theme.error,
                                  },
                                ]}
                              >
                                {move.wasCorrect ? '✓' : '✗'}
                              </Text>
                            </View>
                          </View>

                          {/* Expanded explanation */}
                          {isExpanded && move.techniqueExplanation && (
                            <View
                              style={[
                                styles.explanation,
                                { backgroundColor: theme.surface + '80' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.explanationText,
                                  { color: theme.textSecondary },
                                ]}
                              >
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
          <View style={[styles.footer, { borderTopColor: theme.borderLight }]}>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: theme.buttonBg }]}
              onPress={onClose}
            >
              <Text style={[styles.closeBtnText, { color: theme.buttonText }]}>
                Close
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
    backgroundColor: 'rgba(26, 20, 16, 0.6)',
  },
  modal: {
    flex: 1,
    marginTop: 80,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 3,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
  },
  statLabel: {
    fontFamily: 'Lora_400Regular',
    fontSize: 11,
    marginTop: 2,
  },

  // Technique stats
  techniqueSection: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  techniqueTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
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
  },

  // Board
  boardSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },

  // Actions
  actionSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
  },

  // Move history
  historySection: {
    padding: 16,
  },
  historyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
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
    textAlign: 'center',
    paddingVertical: 32,
  },
  moveItem: {
    marginBottom: 8,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  moveNumberText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 12,
  },
  moveDetails: {
    flex: 1,
  },
  moveText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 13,
  },
  moveValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  moveValueElim: {
    fontFamily: 'PlayfairDisplay_700Bold',
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
  },
  moveResult: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    marginTop: 2,
  },
  explanation: {
    marginTop: 8,
    borderRadius: 4,
    padding: 8,
  },
  explanationText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 12,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    padding: 20,
  },
  closeBtn: {
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 16,
  },
  closeBtnText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
  },
});
