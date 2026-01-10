/**
 * Badge Component
 *
 * A flexible badge/chip component for labels, filters, and tags.
 */

import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import theme, { withOpacity } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Badge({
  label,
  color = theme.colors.primary[500],
  variant = 'subtle', // 'subtle', 'solid', 'outline'
  size = 'md', // 'sm', 'md', 'lg'
  selected = false,
  onPress,
  style,
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Size styles
  const sizeStyles = {
    sm: {
      paddingHorizontal: theme.spacing[1.5],
      paddingVertical: theme.spacing[0.5],
      fontSize: 11,
    },
    md: {
      paddingHorizontal: theme.spacing[2.5],
      paddingVertical: theme.spacing[1],
      fontSize: 13,
    },
    lg: {
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[1.5],
      fontSize: 14,
    },
  };

  // Variant styles
  const getVariantStyles = () => {
    if (selected) {
      return {
        container: {
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
        },
        text: {
          color: theme.colors.text.inverse,
        },
      };
    }

    switch (variant) {
      case 'solid':
        return {
          container: {
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
          },
          text: {
            color: theme.colors.text.inverse,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: color,
            borderWidth: 1,
          },
          text: {
            color: color,
          },
        };
      case 'subtle':
      default:
        return {
          container: {
            backgroundColor: withOpacity(color, 0.12),
            borderColor: 'transparent',
            borderWidth: 1,
          },
          text: {
            color: color,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();

  const content = (
    <>
      <Animated.View
        style={[
          styles.container,
          sizeStyles[size],
          variantStyles.container,
          animatedStyle,
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            { fontSize: sizeStyles[size].fontSize },
            variantStyles.text,
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.95, theme.animation.spring.stiff);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, theme.animation.spring.gentle);
        }}
        style={[
          styles.container,
          sizeStyles[size],
          variantStyles.container,
          animatedStyle,
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            { fontSize: sizeStyles[size].fontSize },
            variantStyles.text,
          ]}
        >
          {label}
        </Text>
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles[size],
        variantStyles.container,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: sizeStyles[size].fontSize },
          variantStyles.text,
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: theme.typography.fontWeight.medium,
  },
});
