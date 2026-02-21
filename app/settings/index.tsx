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
import { useTheme } from '../../src/ui/hooks/useTheme';
import { THEMES, ThemeName } from '../../src/ui/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const {
    soundEnabled,
    hapticsEnabled,
    showTimer,
    highlightPeers,
    autoRemoveNotes,
    theme: currentThemeName,
    toggleSound,
    toggleHaptics,
    toggleTimer,
    toggleHighlightPeers,
    toggleAutoRemoveNotes,
    setTheme,
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
        <Text style={[styles.settingLabel, { color: theme.text }]}>
          {label}
        </Text>
        <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
          {description}
        </Text>
      </View>
      <Switch
        trackColor={{ false: theme.borderLight, true: theme.textSecondary }}
        thumbColor={value ? theme.surface : '#f4f3f4'}
        ios_backgroundColor={theme.borderLight}
        onValueChange={onToggle}
        value={value}
      />
    </View>
  );

  const themeOptions = Object.values(THEMES);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.text }]}>
              ← BACK
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>SETTINGS</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Theme Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.error }]}>
            THEME
          </Text>

          <View style={styles.themeRow}>
            {themeOptions.map((t) => {
              const isActive = currentThemeName === t.name;
              return (
                <Pressable
                  key={t.name}
                  style={[
                    styles.themeSwatch,
                    {
                      borderColor: isActive ? theme.accent : theme.borderLight,
                    },
                    isActive && styles.themeSwatchActive,
                  ]}
                  onPress={() => setTheme(t.name as ThemeName)}
                >
                  {/* Color preview */}
                  <View style={styles.themePreview}>
                    <View
                      style={[styles.previewTop, { backgroundColor: t.bg }]}
                    />
                    <View
                      style={[
                        styles.previewMiddle,
                        { backgroundColor: t.border },
                      ]}
                    />
                    <View
                      style={[
                        styles.previewBottom,
                        { backgroundColor: t.accent },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: isActive ? theme.text : theme.textMuted },
                    ]}
                  >
                    {t.label}
                  </Text>
                  {isActive && <Text style={styles.themeCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.error }]}>
            GAMEPLAY
          </Text>

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

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.error }]}>
            AUDIO & HAPTICS
          </Text>

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

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.aboutSection}>
          <Text style={[styles.aboutTitle, { color: theme.text }]}>
            NEWSPRINT SUDOKU
          </Text>
          <Text style={[styles.version, { color: theme.textSecondary }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.copyright, { color: theme.textMuted }]}>
            © 2024 Daily Puzzle Co.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  title: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 24,
    letterSpacing: 1,
  },
  divider: {
    height: 2,
    marginVertical: 20,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 18,
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
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 14,
  },

  // Theme Selector
  themeRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 8,
  },
  themeSwatch: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  themeSwatchActive: {
    borderWidth: 3,
  },
  themePreview: {
    width: 52,
    height: 40,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#00000020',
  },
  previewTop: {
    flex: 2,
  },
  previewMiddle: {
    flex: 1,
  },
  previewBottom: {
    flex: 1,
  },
  themeLabel: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  themeCheck: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontSize: 14,
    color: '#3A8F3A',
    fontWeight: 'bold',
  },

  aboutSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  aboutTitle: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 20,
    marginBottom: 8,
  },
  version: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  copyright: {
    fontFamily: 'Lora_400Regular',
    fontSize: 12,
  },
});
