import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { MoveRecord } from '../../core/types';
import {
  TECHNIQUE_CATEGORIES,
  TechniqueCategory,
  TechniqueType,
} from '../../core/types';
import { useGameStore } from '../../store/GameStore';

interface MoveHistoryReviewProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Get color classes for technique category badges
 */
const getCategoryColors = (category: TechniqueCategory) => {
  switch (category) {
    case TechniqueCategory.BASIC:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-300',
      };
    case TechniqueCategory.INTERMEDIATE:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300',
      };
    case TechniqueCategory.ADVANCED:
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-300',
      };
  }
};

/**
 * Displays game statistics and move history after game completion.
 */
export function MoveHistoryReview({
  visible,
  onClose,
}: MoveHistoryReviewProps) {
  const moveHistory = useGameStore((state) => state.moveHistory);
  const elapsedSeconds = useGameStore((state) => state.elapsedSeconds);
  const isGameWon = useGameStore((state) => state.isGameWon);

  // Track expanded move for showing technique explanation
  const [expandedMoveIndex, setExpandedMoveIndex] = useState<number | null>(
    null
  );

  // Calculate statistics
  const totalMoves = moveHistory.length;
  const correctMoves = moveHistory.filter((m) => m.wasCorrect).length;
  const mistakes = totalMoves - correctMoves;
  const accuracy =
    totalMoves > 0 ? Math.round((correctMoves / totalMoves) * 100) : 0;

  // Calculate technique statistics grouped by category
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

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format timestamp relative to game start
  const formatMoveTime = (move: MoveRecord, index: number) => {
    if (index === 0) return '0:00';
    const firstMoveTime = moveHistory[0].timestamp;
    const diffSeconds = Math.floor((move.timestamp - firstMoveTime) / 1000);
    return formatTime(diffSeconds);
  };

  // Get category for a technique
  const getTechniqueCategory = (
    technique: TechniqueType
  ): TechniqueCategory => {
    return TECHNIQUE_CATEGORIES[technique] || TechniqueCategory.BASIC;
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60">
        <View className="mt-20 flex-1 rounded-t-3xl bg-white">
          {/* Header */}
          <View className="border-b border-gray-200 p-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-gray-900">
                {isGameWon ? '🎉 Victory!' : '📊 Game Summary'}
              </Text>
              <Pressable onPress={onClose} className="p-2">
                <Text className="text-xl text-gray-500">✕</Text>
              </Pressable>
            </View>
          </View>

          {/* Basic Statistics */}
          <View className="flex-row border-b border-gray-200 p-4">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-blue-600">
                {formatTime(elapsedSeconds)}
              </Text>
              <Text className="text-xs text-gray-500">Time</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-green-600">
                {accuracy}%
              </Text>
              <Text className="text-xs text-gray-500">Accuracy</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-purple-600">
                {totalMoves}
              </Text>
              <Text className="text-xs text-gray-500">Moves</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-red-500">
                {mistakes}
              </Text>
              <Text className="text-xs text-gray-500">Errors</Text>
            </View>
          </View>

          {/* Technique Statistics */}
          <View className="border-b border-gray-200 px-4 py-3">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Techniques Used
            </Text>
            <View className="flex-row justify-between">
              <View className="flex-1 flex-row items-center">
                <View className="mr-2 h-3 w-3 rounded-full bg-gray-400" />
                <Text className="text-xs text-gray-600">
                  Basic: {techniqueStats[TechniqueCategory.BASIC]}
                </Text>
              </View>
              <View className="flex-1 flex-row items-center">
                <View className="mr-2 h-3 w-3 rounded-full bg-blue-500" />
                <Text className="text-xs text-gray-600">
                  Intermediate: {techniqueStats[TechniqueCategory.INTERMEDIATE]}
                </Text>
              </View>
              <View className="flex-1 flex-row items-center">
                <View className="mr-2 h-3 w-3 rounded-full bg-purple-500" />
                <Text className="text-xs text-gray-600">
                  Advanced: {techniqueStats[TechniqueCategory.ADVANCED]}
                </Text>
              </View>
            </View>
          </View>

          {/* Move History Timeline */}
          <View className="flex-1 p-4">
            <Text className="mb-3 text-lg font-semibold text-gray-800">
              Move History
            </Text>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {moveHistory.length === 0 ? (
                <Text className="py-8 text-center text-gray-400">
                  No moves recorded
                </Text>
              ) : (
                moveHistory.map((move, index) => {
                  const category = move.technique
                    ? getTechniqueCategory(move.technique)
                    : null;
                  const colors = category ? getCategoryColors(category) : null;
                  const isExpanded = expandedMoveIndex === index;

                  return (
                    <Pressable
                      key={index}
                      onPress={() =>
                        setExpandedMoveIndex(isExpanded ? null : index)
                      }
                    >
                      <View
                        className={`mb-2 rounded-lg p-3 ${
                          move.wasCorrect ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <View className="flex-row items-center">
                          {/* Move Number */}
                          <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <Text className="text-sm font-medium text-gray-600">
                              {index + 1}
                            </Text>
                          </View>

                          {/* Move Details */}
                          <View className="flex-1">
                            <Text className="font-medium text-gray-800">
                              {move.type === 'elimination' ? (
                                <>
                                  Removed Note{' '}
                                  <Text className="font-bold text-red-500 line-through">
                                    {move.value}
                                  </Text>
                                </>
                              ) : (
                                <>
                                  Placed{' '}
                                  <Text className="font-bold text-blue-600">
                                    {move.value}
                                  </Text>
                                </>
                              )}{' '}
                              at R{move.row + 1}C{move.col + 1}
                            </Text>
                            {move.technique && colors && (
                              <View className="mt-1 flex-row items-center">
                                <View
                                  className={`rounded-full px-2 py-0.5 ${colors.bg}`}
                                >
                                  <Text
                                    className={`text-xs font-medium ${colors.text}`}
                                  >
                                    {move.technique}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>

                          {/* Time & Status */}
                          <View className="items-end">
                            <Text className="text-xs text-gray-400">
                              {formatMoveTime(move, index)}
                            </Text>
                            <Text
                              className={`text-xs font-medium ${
                                move.wasCorrect
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {move.wasCorrect ? '✓' : '✗'}
                            </Text>
                          </View>
                        </View>

                        {/* Expanded Explanation */}
                        {isExpanded && move.techniqueExplanation && (
                          <View className="mt-2 rounded-md bg-white/80 p-2">
                            <Text className="text-xs italic text-gray-600">
                              {move.techniqueExplanation}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* Actions */}
          <View className="border-t border-gray-200 p-6">
            <Pressable
              className="items-center rounded-xl bg-blue-600 py-4"
              onPress={onClose}
            >
              <Text className="text-lg font-semibold text-white">Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
