import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useRef } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { AchievementDef } from '../../storage/achievementsStorage';
import { captureView } from '../../utils/imageCapture';

interface AchievementCardModalProps {
  achievement: AchievementDef | null;
  unlockedAt: number | null;
  onClose: () => void;
}

/**
 * Beautiful full-screen achievement card modal, styled like a framed
 * newspaper clipping. Supports share and save-to-photos via view capture.
 */
export function AchievementCardModal({
  achievement,
  unlockedAt,
  onClose,
}: AchievementCardModalProps) {
  const cardRef = useRef<View>(null);

  if (!achievement) return null;

  const isUnlocked = !!unlockedAt;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      if (cardRef.current) {
        const uri = await captureView(cardRef);
        if (Platform.OS === 'web') {
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            try {
              await Sharing.shareAsync(uri);
              return;
            } catch {
              // fall through
            }
          }
          // Web fallback: download
          const link = document.createElement('a');
          link.href = uri;
          link.download = `achievement-${achievement.id.toLowerCase()}.png`;
          link.click();
          return;
        }
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
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

  const handleSave = async () => {
    try {
      if (cardRef.current) {
        const uri = await captureView(cardRef);
        if (Platform.OS === 'web') {
          const link = document.createElement('a');
          link.href = uri;
          link.download = `achievement-${achievement.id.toLowerCase()}.png`;
          link.click();
          return;
        }
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission needed',
            'Please grant permission to save photos'
          );
          return;
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Saved!', 'Achievement card saved to your photos.');
      }
    } catch (error) {
      console.error('Failed to save', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!achievement}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Capturable card area */}
        <View ref={cardRef} collapsable={false} style={styles.cardOuter}>
          {/* Decorative border frame */}
          <View style={styles.cardFrame}>
            {/* Top ornament */}
            <View style={styles.ornamentRow}>
              <View style={styles.ornamentLine} />
              <Text style={styles.ornamentSymbol}>✦</Text>
              <View style={styles.ornamentLine} />
            </View>

            {/* Newspaper masthead */}
            <Text style={styles.mastheadText}>NEWSPRINT SUDOKU</Text>
            <View style={styles.mastheadRule} />

            {/* Icon */}
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>
                {isUnlocked ? achievement.icon : '🔒'}
              </Text>
            </View>

            {/* Achievement title */}
            <Text style={styles.achievementTitle}>
              {achievement.title.toUpperCase()}
            </Text>

            {/* Divider */}
            <View style={styles.titleRule} />

            {/* Description */}
            <Text style={styles.achievementDesc}>
              {achievement.description}
            </Text>

            {/* Unlock date or locked status */}
            {isUnlocked && unlockedAt ? (
              <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>ACHIEVED</Text>
                <Text style={styles.dateValue}>{formatDate(unlockedAt)}</Text>
              </View>
            ) : (
              <View style={styles.dateContainer}>
                <Text style={styles.lockedText}>🔒 Not yet unlocked</Text>
              </View>
            )}

            {/* Bottom ornament */}
            <View style={styles.ornamentRow}>
              <View style={styles.ornamentLine} />
              <Text style={styles.ornamentSymbol}>✦</Text>
              <View style={styles.ornamentLine} />
            </View>
          </View>
        </View>

        {/* Action buttons (outside capture area) */}
        <View style={styles.actionsRow}>
          {isUnlocked && (
            <>
              <Pressable style={styles.actionBtn} onPress={handleShare}>
                <Text style={styles.actionBtnText}>🔗 Share</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={handleSave}>
                <Text style={styles.actionBtnText}>💾 Save Image</Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 20, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Card outer (captured area)
  cardOuter: {
    backgroundColor: '#F5EDE0',
    borderRadius: 4,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
    maxWidth: 320,
    width: '100%',
  },

  // Inner frame with border
  cardFrame: {
    borderWidth: 2,
    borderColor: '#2A2118',
    padding: 24,
    alignItems: 'center',
  },

  // Ornaments
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#C4B08A',
  },
  ornamentSymbol: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 12,
    color: '#edb942',
    marginHorizontal: 10,
  },

  // Masthead
  mastheadText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
    color: '#8B7355',
    letterSpacing: 4,
    marginBottom: 4,
  },
  mastheadRule: {
    width: '60%',
    height: 2,
    backgroundColor: '#2A2118',
    marginBottom: 20,
  },

  // Icon
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#edb942',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#2A2118',
    shadowColor: '#edb942',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconText: {
    fontSize: 36,
  },

  // Title
  achievementTitle: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 22,
    color: '#2A2118',
    textAlign: 'center',
    letterSpacing: 1,
  },
  titleRule: {
    width: '40%',
    height: 1,
    backgroundColor: '#C4B08A',
    marginVertical: 12,
  },

  // Description
  achievementDesc: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: '#6B5540',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Date
  dateContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 9,
    color: '#8B7355',
    letterSpacing: 3,
    marginBottom: 2,
  },
  dateValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: '#2A2118',
  },
  lockedText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 13,
    color: '#A09888',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
    maxWidth: 320,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FDF8F0',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2118',
    borderBottomWidth: 3,
    borderBottomColor: '#1A1410',
  },
  actionBtnText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 13,
    color: '#2A2118',
  },

  // Close
  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  closeBtnText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    color: '#D4C5A8',
  },
});
