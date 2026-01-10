/**
 * QuickAddBar Component
 *
 * A quick-add input bar for creating tasks rapidly.
 * Features:
 * - Quick add with current filter assignment
 * - Button to open detailed add modal
 * - Smooth animations
 */

import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text, Keyboard } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import theme from '../theme';
import useHaptics from '../hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function QuickAddBar({
  onQuickAdd,
  onOpenDetails,
  placeholder = 'Add a task...',
}) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const haptics = useHaptics();

  const addButtonScale = useSharedValue(1);
  const detailsButtonScale = useSharedValue(1);

  const handleSubmit = () => {
    if (!text.trim()) return;

    haptics.success();
    onQuickAdd?.(text.trim());
    setText('');
    Keyboard.dismiss();
  };

  const handleOpenDetails = () => {
    haptics.light();
    onOpenDetails?.(text.trim());
    setText('');
  };

  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const detailsButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: detailsButtonScale.value }],
  }));

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.tertiary}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          blurOnSubmit={false}
        />
      </View>

      {/* Add button */}
      <AnimatedPressable
        style={[
          styles.addButton,
          hasText && styles.addButtonActive,
          addButtonAnimatedStyle,
        ]}
        onPress={handleSubmit}
        onPressIn={() => {
          addButtonScale.value = withSpring(0.9, theme.animation.spring.stiff);
        }}
        onPressOut={() => {
          addButtonScale.value = withSpring(1, theme.animation.spring.gentle);
        }}
        disabled={!hasText}
      >
        <Text style={[styles.addButtonText, hasText && styles.addButtonTextActive]}>
          +
        </Text>
      </AnimatedPressable>

      {/* Details button */}
      <AnimatedPressable
        style={[styles.detailsButton, detailsButtonAnimatedStyle]}
        onPress={handleOpenDetails}
        onPressIn={() => {
          detailsButtonScale.value = withSpring(0.9, theme.animation.spring.stiff);
        }}
        onPressOut={() => {
          detailsButtonScale.value = withSpring(1, theme.animation.spring.gentle);
        }}
      >
        <Text style={styles.detailsButtonText}>⋯</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: theme.spacing[4],
    gap: theme.spacing[2],
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  input: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: {
    backgroundColor: theme.colors.primary[500],
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: theme.colors.text.tertiary,
  },
  addButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  detailsButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
});
