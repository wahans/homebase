/**
 * useHaptics Hook
 *
 * Provides haptic feedback functions with platform checks.
 * Wraps expo-haptics for easy use throughout the app.
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function useHaptics() {
  const isHapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

  /**
   * Light haptic feedback - for selections, toggles
   */
  const light = useCallback(() => {
    if (isHapticsAvailable) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isHapticsAvailable]);

  /**
   * Medium haptic feedback - for confirmations
   */
  const medium = useCallback(() => {
    if (isHapticsAvailable) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [isHapticsAvailable]);

  /**
   * Heavy haptic feedback - for important actions
   */
  const heavy = useCallback(() => {
    if (isHapticsAvailable) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [isHapticsAvailable]);

  /**
   * Success haptic feedback - for completed actions
   */
  const success = useCallback(() => {
    if (isHapticsAvailable) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isHapticsAvailable]);

  /**
   * Warning haptic feedback - for warnings
   */
  const warning = useCallback(() => {
    if (isHapticsAvailable) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [isHapticsAvailable]);

  /**
   * Error haptic feedback - for errors
   */
  const error = useCallback(() => {
    if (isHapticsAvailable) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isHapticsAvailable]);

  /**
   * Selection haptic feedback - for selections in lists
   */
  const selection = useCallback(() => {
    if (isHapticsAvailable) {
      Haptics.selectionAsync();
    }
  }, [isHapticsAvailable]);

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
  };
}
