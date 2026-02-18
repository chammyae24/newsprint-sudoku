import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Difficulty } from '../../src/core/types';
import { GameStats, loadStatsAsync } from '../../src/storage/statsStorage';

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatsAsync().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const winRate =
    stats.totalGamesPlayed > 0
      ? Math.round((stats.totalGamesWon / stats.totalGamesPlayed) * 100)
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </Pressable>
        <Text style={styles.title}>STATISTICS</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Strip */}
        <View style={styles.overviewContainer}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{stats.totalGamesPlayed}</Text>
            <Text style={styles.overviewLabel}>PLAYED</Text>
            <View style={styles.separator} />
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{winRate}%</Text>
            <Text style={styles.overviewLabel}>WIN RATE</Text>
            <View style={styles.separator} />
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>
              {stats.currentWinStreak} <Text style={styles.fireEmoji}>🔥</Text>
            </Text>
            <Text style={styles.overviewLabel}>STREAK</Text>
            <View style={styles.separator} />
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{stats.bestWinStreak}</Text>
            <Text style={styles.overviewLabel}>BEST</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Difficulty Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>BY DIFFICULTY</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.cell, styles.colDiff]}>LEVEL</Text>
              <Text style={[styles.cell, styles.colNum]}>WINS</Text>
              <Text style={[styles.cell, styles.colNum]}>BEST</Text>
              <Text style={[styles.cell, styles.colNum]}>AVG</Text>
            </View>
            {Object.values(Difficulty).map((diff) => {
              const ds = stats.byDifficulty[diff];
              const formatTime = (s: number | null) => {
                if (s === null) return '-';
                const m = Math.floor(s / 60);
                const sec = s % 60;
                return `${m}:${sec.toString().padStart(2, '0')}`;
              };
              return (
                <View key={diff} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.colDiff]}>{diff}</Text>
                  <Text style={[styles.cell, styles.colNum]}>
                    {ds.gamesWon}/{ds.gamesPlayed}
                  </Text>
                  <Text style={[styles.cell, styles.colNum]}>
                    {formatTime(ds.bestTime)}
                  </Text>
                  <Text style={[styles.cell, styles.colNum]}>
                    {formatTime(ds.averageTime)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Technique Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TOP TECHNIQUES</Text>
          {Object.entries(stats.techniqueUsage)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tech, count], index) => {
              const max = Math.max(...Object.values(stats.techniqueUsage));
              return (
                <View key={tech} style={styles.techniqueRow}>
                  <Text style={styles.techniqueName}>
                    {index + 1}. {tech}
                  </Text>
                  <View style={[styles.techniqueBarContainer, { flex: 1 }]}>
                    <View
                      style={[
                        styles.techniqueBar,
                        {
                          width: `${(count / max) * 100}%`,
                        },
                      ]}
                    />
                    <Text style={styles.techniqueCount}>{count}</Text>
                  </View>
                </View>
              );
            })}
          {Object.keys(stats.techniqueUsage).length === 0 && (
            <Text style={styles.emptyText}>No techniques tracked yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 16,
    color: '#8B7355',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2A2118',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
    color: '#2A2118',
  },
  title: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 20,
    color: '#2A2118',
    letterSpacing: 1,
  },
  headerRight: {
    width: 60, // approximate width of back button
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#C4B08A',
    marginVertical: 20,
    marginHorizontal: 16,
  },
  // Overview
  overviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Changed from space-evenly to manual spacing with separators
    alignItems: 'center',
    gap: 0,
    marginBottom: 0,
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1, // Distribute evenly
    borderRightWidth: 0,
  },
  overviewValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: '#2A2118',
  },
  overviewLabel: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
    color: '#8B7355',
    marginTop: 4,
  },
  separator: {
    position: 'absolute',
    right: 0,
    top: 5,
    bottom: 5,
    width: 1,
    backgroundColor: '#C4B08A',
  },
  fireEmoji: {
    fontSize: 20,
  },
  // Section
  section: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 16,
    color: '#2A2118',
    marginBottom: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: '#C4B08A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#C4B08A',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableHeaderRow: {
    backgroundColor: '#E8D8B8',
    borderBottomWidth: 2,
    borderBottomColor: '#2A2118',
  },
  cell: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 13, // Slightly larger
    color: '#2A2118',
  },
  colDiff: {
    flex: 2, // Use flex instead of percentage
    fontSize: 12,
  },
  colNum: {
    flex: 1.5,
    textAlign: 'center',
  },
  // Technique
  techniqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  techniqueName: {
    width: '40%',
    fontFamily: 'Lora_400Regular',
    fontSize: 12,
    color: '#2A2118',
  },
  techniqueBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techniqueBar: {
    height: 12,
    backgroundColor: '#8B7355',
    borderRadius: 6,
  },
  techniqueCount: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
    color: '#8B7355',
    width: 25,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Lora_400Regular_Italic',
    color: '#8B7355',
    marginTop: 10,
  },
});
