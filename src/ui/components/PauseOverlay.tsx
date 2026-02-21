import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface PauseOverlayProps {
  visible: boolean;
  onResume: () => void;
  onQuit: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  visible,
  onResume,
  onQuit,
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.coffeeStain,
              { borderColor: theme.textMuted + '30' },
            ]}
          />

          <Text style={[styles.title, { color: theme.text }]}>
            COFFEE BREAK
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            The puzzle is paused.
          </Text>

          <View
            style={[styles.divider, { backgroundColor: theme.borderLight }]}
          />

          <Pressable
            style={[styles.resumeButton, { backgroundColor: theme.buttonBg }]}
            onPress={onResume}
          >
            <Text
              style={[styles.resumeButtonText, { color: theme.buttonText }]}
            >
              RESUME PUZZLE
            </Text>
          </Pressable>

          <Pressable
            style={[styles.quitButton, { borderColor: theme.borderLight }]}
            onPress={onQuit}
          >
            <Text style={[styles.quitButtonText, { color: theme.textMuted }]}>
              QUIT GAME
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 20, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    maxWidth: 320,
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  coffeeStain: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    zIndex: -1,
  },
  title: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  divider: {
    width: '60%',
    height: 1,
    marginBottom: 24,
  },
  resumeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumeButtonText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  quitButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
  },
  quitButtonText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
  },
});
