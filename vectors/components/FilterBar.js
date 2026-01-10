/**
 * FilterBar Component
 *
 * Filter and sort controls for the task list.
 * Features:
 * - Assignment filters (All, Me, You, Us)
 * - Sort options (Newest, Due Date, Priority)
 * - Animated selection
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import theme, { getAssignmentColor } from '../theme';
import useHaptics from '../hooks/useHaptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FilterChip({ label, selected, color, onPress }) {
  const scale = useSharedValue(1);
  const haptics = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.filterChip,
        selected && styles.filterChipSelected,
        selected && { backgroundColor: color },
        animatedStyle,
      ]}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, theme.animation.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.animation.spring.gentle);
      }}
    >
      <Text
        style={[
          styles.filterChipText,
          selected && styles.filterChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function SortChip({ label, selected, onPress }) {
  const haptics = useHaptics();

  return (
    <Pressable
      style={[styles.sortChip, selected && styles.sortChipSelected]}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
    >
      <Text style={[styles.sortChipText, selected && styles.sortChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function FilterBar({
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
}) {
  const filters = [
    { key: 'all', label: 'All', color: theme.colors.primary[500] },
    { key: 'me', label: 'Me', color: getAssignmentColor('me') },
    { key: 'you', label: 'You', color: getAssignmentColor('you') },
    { key: 'us', label: 'Us', color: getAssignmentColor('us') },
  ];

  const sortOptions = [
    { key: 'manual', label: '↕ Manual' },
    { key: 'created', label: 'Newest' },
    { key: 'due', label: 'Due Date' },
    { key: 'priority', label: 'Priority' },
  ];

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            color={f.color}
            onPress={() => onFilterChange?.(f.key)}
          />
        ))}
      </ScrollView>

      {/* Sort options */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort:</Text>
        {sortOptions.map((option) => (
          <SortChip
            key={option.key}
            label={option.label}
            selected={sortBy === option.key}
            onPress={() => onSortChange?.(option.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[2],
    gap: theme.spacing[2],
  },
  filterChip: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.tertiary,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primary[500],
  },
  filterChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  filterChipTextSelected: {
    color: theme.colors.text.inverse,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[3],
    gap: theme.spacing[2],
  },
  sortLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginRight: theme.spacing[1],
  },
  sortChip: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2.5],
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.tertiary,
  },
  sortChipSelected: {
    backgroundColor: theme.colors.primary[100],
  },
  sortChipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  sortChipTextSelected: {
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.medium,
  },
});
