import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email to confirm your account!');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#F5F3FF', '#FDF2F8', '#ECFDF5', '#F5F3FF']}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating color blobs */}
      <View style={[styles.blob, styles.blobPurple]} />
      <View style={[styles.blob, styles.blobPink]} />
      <View style={[styles.blob, styles.blobGreen]} />

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
        <Text style={styles.tagline}>to-do lists built for you</Text>

        {/* Decorative dots */}
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: '#7C3AED' }]} />
          <View style={[styles.dot, { backgroundColor: '#EC4899' }]} />
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Loading...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.6}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
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
  blob: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.4,
  },
  blobPurple: {
    width: 200,
    height: 200,
    top: 50,
    right: -50,
    backgroundColor: '#DDD6FE',
  },
  blobPink: {
    width: 150,
    height: 150,
    top: 200,
    left: -30,
    backgroundColor: '#FBCFE8',
  },
  blobGreen: {
    width: 180,
    height: 180,
    bottom: 150,
    right: 20,
    backgroundColor: '#A7F3D0',
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
  form: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
