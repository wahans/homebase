/**
 * Vectors App
 *
 * Main entry point for the Vectors task management app.
 * Sets up navigation, auth state, and gesture handling.
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './lib/supabase';
import theme from './theme';

// Screens
import LoginScreen from './screens/LoginScreen';
import TaskListScreen from './screens/TaskListScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return null; // Could add a splash screen here
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.background.primary,
            },
            headerTintColor: theme.colors.text.primary,
            headerTitleStyle: {
              fontWeight: theme.typography.fontWeight.semibold,
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: theme.colors.background.secondary,
            },
          }}
        >
          {session ? (
            <Stack.Screen
              name="Tasks"
              component={TaskListScreen}
              options={{
                headerShown: false,
              }}
            />
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
