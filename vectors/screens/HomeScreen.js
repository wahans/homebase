import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      {/* Background accent */}
      <View style={styles.backgroundAccent} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <View style={styles.logoArrow1} />
            <View style={styles.logoArrow2} />
          </View>
          <Text style={styles.logoText}>vectors</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Your family's task manager</Text>

        {/* Decorative dots */}
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
          <View style={[styles.dot, { backgroundColor: '#EC4899' }]} />
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
        </View>
      </View>

      {/* Bottom actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('TaskList')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSignOut}
          activeOpacity={0.6}
        >
          <Text style={styles.secondaryButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundAccent: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F0F9FF',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    position: 'relative',
  },
  logoArrow1: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#7C3AED',
    transform: [{ rotate: '45deg' }],
    top: 8,
    left: 8,
    borderRadius: 4,
  },
  logoArrow2: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#EC4899',
    transform: [{ rotate: '45deg' }],
    bottom: 8,
    right: 8,
    borderRadius: 4,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: -1,
    color: '#111827',
  },
  tagline: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '400',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '500',
  },
});
