import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ACHIEVEMENTS,
  AchievementDef,
  AchievementState,
  loadAchievementsAsync,
} from '../../src/storage/achievementsStorage';
import { AchievementCardModal } from '../../src/ui/components/AchievementCardModal';
import { useTheme } from '../../src/ui/hooks/useTheme';

export default function AchievementsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [state, setState] = useState<AchievementState>({});
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] =
    useState<AchievementDef | null>(null);

  useEffect(() => {
    loadAchievementsAsync().then((s) => {
      setState(s);
      setLoading(false);
    });
  }, []);

  const unlockedCount = Object.values(state).filter(Boolean).length;
  const totalCount = ACHIEVEMENTS.length;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.text }]}>
            ← BACK
          </Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>ACHIEVEMENTS</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBarBg,
            {
              backgroundColor: theme.borderLight,
              borderColor: theme.borderLight,
            },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: theme.accent,
                width: `${(unlockedCount / totalCount) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textMuted }]}>
          {unlockedCount} / {totalCount} UNLOCKED
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ACHIEVEMENTS.map((achievement) => {
          const unlockedAt = state[achievement.id];
          const isUnlocked = !!unlockedAt;

          return (
            <Pressable
              key={achievement.id}
              style={[
                styles.achievementCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
                !isUnlocked && {
                  backgroundColor: theme.surfaceAlt,
                  borderColor: theme.borderLight,
                  opacity: 0.7,
                },
              ]}
              onPress={() => setSelectedAchievement(achievement)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.accent },
                  !isUnlocked && { backgroundColor: theme.borderLight },
                ]}
              >
                <Text style={[styles.icon, !isUnlocked && styles.iconLocked]}>
                  {isUnlocked ? achievement.icon : '🔒'}
                </Text>
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.achievementTitle,
                    { color: theme.text },
                    !isUnlocked && { color: theme.textMuted },
                  ]}
                >
                  {achievement.title}
                </Text>
                <Text
                  style={[
                    styles.achievementDesc,
                    { color: theme.textSecondary },
                    !isUnlocked && { color: theme.textMuted },
                  ]}
                >
                  {achievement.description}
                </Text>
                {isUnlocked && unlockedAt && (
                  <Text
                    style={[styles.unlockedDate, { color: theme.textMuted }]}
                  >
                    Unlocked {formatDate(unlockedAt)}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Achievement Card Modal */}
      <AchievementCardModal
        achievement={selectedAchievement}
        unlockedAt={
          selectedAchievement ? (state[selectedAchievement.id] ?? null) : null
        }
        onClose={() => setSelectedAchievement(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
  },
  title: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 20,
    letterSpacing: 1,
  },
  headerRight: {
    width: 60,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 12,
    letterSpacing: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 40,
  },

  // Cards
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderBottomWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: {
    fontSize: 22,
  },
  iconLocked: {
    fontSize: 18,
    opacity: 0.6,
  },
  textContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 15,
    marginBottom: 2,
  },
  achievementDesc: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 12,
  },
  unlockedDate: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
