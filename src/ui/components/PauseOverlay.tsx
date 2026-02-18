import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.coffeeStain} />

          <Text style={styles.title}>COFFEE BREAK</Text>
          <Text style={styles.subtitle}>The puzzle is paused.</Text>

          <View style={styles.divider} />

          <Pressable style={styles.resumeButton} onPress={onResume}>
            <Text style={styles.resumeButtonText}>RESUME PUZZLE</Text>
          </Pressable>

          <Pressable style={styles.quitButton} onPress={onQuit}>
            <Text style={styles.quitButtonText}>QUIT GAME</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 20, 16, 0.85)', // Darker overlay to hide board
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#F5EDE0',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2A2118',
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
    borderColor: 'rgba(139, 115, 85, 0.2)',
    zIndex: -1,
  },
  title: {
    fontFamily: 'PlayfairDisplay_900Black',
    fontSize: 28,
    color: '#2A2118',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 24,
    textAlign: 'center',
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: '#C4B08A',
    marginBottom: 24,
  },
  resumeButton: {
    backgroundColor: '#4A3828',
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
    color: '#F5EDE0',
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
    borderColor: '#D4C5A8',
  },
  quitButtonText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 14,
    color: '#8B7355',
  },
});
