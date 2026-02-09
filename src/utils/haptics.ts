import * as Haptics from 'expo-haptics';

/**
 * Trigger haptic feedback for various game events.
 */
export const haptics = {
  /**
   * Light tap for cell selection
   */
  light: async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available
    }
  },

  /**
   * Medium tap for correct input
   */
  success: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics not available
    }
  },

  /**
   * Error vibration for wrong input
   */
  error: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics not available
    }
  },

  /**
   * Heavy tap for game win
   */
  win: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 100);
    } catch {
      // Haptics not available
    }
  },

  /**
   * Strong vibration for game over
   */
  gameOver: async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics not available
    }
  },
};
