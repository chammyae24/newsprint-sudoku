import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../src/storage/settingsStorage';

export default function SettingsScreen() {
  const router = useRouter();

  const {
    soundEnabled,
    hapticsEnabled,
    showTimer,
    highlightPeers,
    autoRemoveNotes,
    toggleSound,
    toggleHaptics,
    toggleTimer,
    toggleHighlightPeers,
    toggleAutoRemoveNotes,
    loadSettings,
  } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const renderSwitchItem = (
    label: string,
    description: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: '#D4C5A8', true: '#6B5540' }}
        thumbColor={value ? '#F5EDE0' : '#f4f3f4'}
        ios_backgroundColor="#D4C5A8"
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← BACK</Text>
          </Pressable>
          <Text style={styles.title}>SETTINGS</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GAMEPLAY</Text>

          {renderSwitchItem(
            'Auto-Remove Notes',
            'Remove notes when a number is placed',
            autoRemoveNotes,
            toggleAutoRemoveNotes
          )}

          {renderSwitchItem(
            'Highlight Peers',
            'Highlight row, column, and box of selected cell',
            highlightPeers,
            toggleHighlightPeers
          )}

          {renderSwitchItem(
            'Show Timer',
            'Display elapsed time during game',
            showTimer,
            toggleTimer
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AUDIO & HAPTICS</Text>

          {renderSwitchItem(
            'Sound Effects',
            'Play sounds for moves and interactions',
            soundEnabled,
            toggleSound
          )}

          {renderSwitchItem(
            'Haptic Feedback',
            'Vibrate on key interactions',
            hapticsEnabled,
            toggleHaptics
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>NEWSPRINT SUDOKU</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2024 Daily Puzzle Co.</Text>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 4,
  },
  backButtonText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
    color: '#4A3828',
  },
  title: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 24,
    color: '#2A2118',
    letterSpacing: 1,
  },
  divider: {
    height: 2,
    backgroundColor: '#2A2118',
    marginVertical: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 18,
    color: '#A02020',
    marginBottom: 16,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#2A2118',
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
    color: '#8B7355',
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  aboutTitle: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 20,
    color: '#2A2118',
    marginBottom: 8,
  },
  version: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
    color: '#6B5540',
    marginBottom: 4,
  },
  copyright: {
    fontFamily: 'Lora_400Regular',
    fontSize: 12,
    color: '#8B7355',
  },
});
