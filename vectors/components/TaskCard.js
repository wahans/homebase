/**
 * TaskCard Component
 *
 * A premium task card with animations and haptic feedback.
 * Features:
 * - Animated checkbox with satisfying feedback
 * - Press animation
 * - Color-coded assignment indicator
 * - Due date and priority badges
 * - Drag-and-drop support for manual reordering
 */

import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import theme, { getAssignmentColor, getPriorityColor, withOpacity } from '../theme';
import useHaptics from '../hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TaskCard({
  task,
  onToggle,
  onPress,
  onDelete,
  drag,           // Function to initiate drag (from DraggableFlatList)
  isActive,       // Whether the item is currently being dragged
  isDraggable,    // Whether to show drag handle (manual sort mode)
}) {
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(task.completed ? 1 : 0);
  const elevation = useSharedValue(0);

  // Update elevation when dragging state changes
  useEffect(() => {
    if (isActive) {
      elevation.value = withSpring(1, theme.animation.spring.stiff);
      scale.value = withSpring(1.02, theme.animation.spring.gentle);
    } else {
      elevation.value = withSpring(0, theme.animation.spring.gentle);
      scale.value = withSpring(1, theme.animation.spring.gentle);
    }
  }, [isActive]);

  // Sync checkbox state with task
  useEffect(() => {
    checkScale.value = withSpring(task.completed ? 1 : 0, theme.animation.spring.bouncy);
  }, [task.completed]);

  // Assignment color
  const assignmentColor = getAssignmentColor(task.assigned_to);

  // Check if overdue
  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date();
  const accentColor = isOverdue ? theme.colors.semantic.error : assignmentColor;

  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Today', isOverdue: false };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', isOverdue: false };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d`, isOverdue: false };
    } else {
      return {
        text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isOverdue: false,
      };
    }
  };

  const dueDateInfo = formatDueDate(task.due_date);

  // Get assignment label
  const getAssignmentLabel = (assignment) => {
    switch (assignment) {
      case 'me': return 'Me';
      case 'you': return 'You';
      case 'us': return 'Us';
      default: return '';
    }
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return null;
    }
  };

  // Get recurring label
  const getRecurringLabel = (recurring) => {
    switch (recurring) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return null;
    }
  };

  // Handle checkbox toggle with animation
  const handleToggle = useCallback(() => {
    const newState = !task.completed;

    // Animate checkbox
    checkScale.value = withSpring(newState ? 1 : 0, theme.animation.spring.bouncy);

    // Haptic feedback
    if (newState) {
      haptics.success();
    } else {
      haptics.light();
    }

    // Call parent handler
    onToggle?.(task);
  }, [task, onToggle, haptics, checkScale]);

  // Handle card press
  const handlePress = useCallback(() => {
    if (isActive) return; // Don't trigger press while dragging
    haptics.light();
    onPress?.(task);
  }, [task, onPress, haptics, isActive]);

  // Handle drag initiation
  const handleLongPress = useCallback(() => {
    if (isDraggable && drag) {
      haptics.medium();
      drag();
    }
  }, [isDraggable, drag, haptics]);

  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(elevation.value, [0, 1], [0.05, 0.2]),
    shadowRadius: interpolate(elevation.value, [0, 1], [2, 12]),
    elevation: interpolate(elevation.value, [0, 1], [1, 8]),
  }));

  // Checkbox animation styles
  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(checkScale.value, [0, 1], [0, 1]) }],
    opacity: checkScale.value,
  }));

  const priorityLabel = getPriorityLabel(task.priority);
  const priorityColor = getPriorityColor(task.priority);
  const recurringLabel = getRecurringLabel(task.recurring);

  return (
    <AnimatedPressable
      style={[
        styles.container,
        animatedCardStyle,
        task.completed && styles.containerCompleted,
        isActive && styles.containerDragging,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={200}
      onPressIn={() => {
        if (!isActive) {
          scale.value = withSpring(0.98, theme.animation.spring.stiff);
        }
      }}
      onPressOut={() => {
        if (!isActive) {
          scale.value = withSpring(1, theme.animation.spring.gentle);
        }
      }}
      disabled={isActive}
    >
      {/* Drag handle (shown in manual sort mode) */}
      {isDraggable && (
        <Pressable
          style={styles.dragHandle}
          onLongPress={handleLongPress}
          delayLongPress={150}
        >
          <Text style={styles.dragHandleText}>⋮⋮</Text>
        </Pressable>
      )}

      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Top row: checkbox + title */}
        <View style={styles.topRow}>
          {/* Checkbox */}
          <Pressable
            style={[styles.checkbox, { borderColor: assignmentColor }]}
            onPress={handleToggle}
            hitSlop={8}
            disabled={isActive}
          >
            <Animated.View
              style={[
                styles.checkboxFill,
                { backgroundColor: assignmentColor },
                animatedCheckStyle,
              ]}
            >
              <Text style={styles.checkmark}>✓</Text>
            </Animated.View>
          </Pressable>

          {/* Title and description */}
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, task.completed && styles.titleCompleted]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            {task.description && (
              <Text style={styles.description} numberOfLines={2}>
                {task.description}
              </Text>
            )}
          </View>
        </View>

        {/* Metadata badges */}
        <View style={styles.badges}>
          {/* Assignment badge */}
          <View style={[styles.badge, { backgroundColor: withOpacity(assignmentColor, 0.15) }]}>
            <Text style={[styles.badgeText, { color: assignmentColor }]}>
              {getAssignmentLabel(task.assigned_to)}
            </Text>
          </View>

          {/* Due date badge */}
          {dueDateInfo && (
            <View style={[styles.badge, dueDateInfo.isOverdue && styles.badgeOverdue]}>
              <Text style={[styles.badgeText, dueDateInfo.isOverdue && styles.badgeTextOverdue]}>
                {dueDateInfo.text}
              </Text>
            </View>
          )}

          {/* Priority badge */}
          {priorityLabel && (
            <View style={[styles.badge, { backgroundColor: withOpacity(priorityColor, 0.15) }]}>
              <Text style={[styles.badgeText, { color: priorityColor }]}>
                {priorityLabel}
              </Text>
            </View>
          )}

          {/* Recurring badge */}
          {recurringLabel && (
            <View style={[styles.badge, { backgroundColor: withOpacity(theme.colors.primary[500], 0.15) }]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary[500] }]}>
                ↻ {recurringLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete button (hidden when dragging) */}
      {onDelete && !isDraggable && (
        <Pressable
          style={styles.deleteButton}
          onPress={() => {
            haptics.warning();
            onDelete?.(task);
          }}
          hitSlop={8}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </Pressable>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[3],
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerCompleted: {
    opacity: 0.6,
  },
  containerDragging: {
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
  },
  dragHandle: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.tertiary,
  },
  dragHandleText: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
    letterSpacing: -2,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: theme.spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxFill: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: theme.colors.text.inverse,
    fontSize: 14,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...theme.typography.styles.body,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.tertiary,
  },
  description: {
    ...theme.typography.styles.bodySmall,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  badge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.tertiary,
  },
  badgeText: {
    ...theme.typography.styles.labelSmall,
    color: theme.colors.text.secondary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  badgeOverdue: {
    backgroundColor: withOpacity(theme.colors.semantic.error, 0.15),
  },
  badgeTextOverdue: {
    color: theme.colors.semantic.error,
  },
  deleteButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 28,
    color: theme.colors.neutral[400],
    fontWeight: '300',
  },
});
