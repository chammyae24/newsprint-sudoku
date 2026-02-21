import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { AchievementDef } from '../../storage/achievementsStorage';

interface AchievementBannerProps {
  achievement: AchievementDef | null;
  onDismiss: () => void;
}

/**
 * Animated slide-down banner announcing a newly unlocked achievement.
 * Newspaper-themed styling, auto-dismisses after 3s.
 */
export const AchievementBanner: React.FC<AchievementBannerProps> = ({
  achievement,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement) {
      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -120,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss();
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-120);
      opacity.setValue(0);
    }
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }], opacity }]}
    >
      <View style={styles.banner}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{achievement.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.unlocked}>🏆 ACHIEVEMENT UNLOCKED</Text>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 100,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2118',
    borderRadius: 8,
    padding: 14,
    borderWidth: 2,
    borderColor: '#edb942ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#edb942ff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  unlocked: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 9,
    color: '#edb942ff',
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 16,
    color: '#F5EDE0',
    marginBottom: 2,
  },
  description: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 12,
    color: '#D4C5A8',
  },
});
