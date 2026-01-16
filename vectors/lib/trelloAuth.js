/**
 * Trello OAuth Authentication Handler
 *
 * Uses Trello's client-side authorization flow (simpler than full OAuth 1.0a)
 * User is directed to Trello's auth page, approves, and token is returned via redirect
 *
 * For native apps, uses Expo's auth proxy since Trello doesn't support custom URL schemes
 */

import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

// Ensure web browser auth sessions complete properly
WebBrowser.maybeCompleteAuthSession();

// Storage keys
const TRELLO_TOKEN_KEY = 'trello_access_token';

// Trello API configuration
const TRELLO_API_KEY = process.env.EXPO_PUBLIC_TRELLO_API_KEY;
const APP_NAME = 'Vectors';

// Web redirect page for native OAuth (Trello doesn't support custom URL schemes)
// Host the docs/trello-callback.html page and set this URL
const WEB_REDIRECT_URL = process.env.EXPO_PUBLIC_TRELLO_REDIRECT_URL;

/**
 * Start Trello OAuth flow
 * Opens browser for user to authorize, returns token via deep link
 */
export const startTrelloAuth = async () => {
  if (!TRELLO_API_KEY) {
    throw new Error('Trello API key not configured. Add EXPO_PUBLIC_TRELLO_API_KEY to .env');
  }

  let redirectUri;

  if (Platform.OS === 'web') {
    // On web, redirect directly back to the app
    redirectUri = AuthSession.makeRedirectUri({
      scheme: 'vectors',
      path: 'trello-callback',
      preferLocalhost: true,
    });
  } else {
    // On native, use a web redirect page that then opens the app
    // This is needed because Trello doesn't accept custom URL schemes
    if (!WEB_REDIRECT_URL) {
      throw new Error('Trello redirect URL not configured. Set EXPO_PUBLIC_TRELLO_REDIRECT_URL in .env');
    }
    redirectUri = WEB_REDIRECT_URL;
  }

  console.log('Redirect URI:', redirectUri);

  // Trello authorization URL
  // scope=read gives read-only access to boards, lists, cards
  // expiration=never means token doesn't expire (user can revoke in Trello settings)
  const authUrl = `https://trello.com/1/authorize?` +
    `expiration=never&` +
    `name=${encodeURIComponent(APP_NAME)}&` +
    `scope=read&` +
    `response_type=token&` +
    `key=${TRELLO_API_KEY}&` +
    `callback_method=fragment&` +
    `return_url=${encodeURIComponent(redirectUri)}`;

  // Open browser for authorization
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type === 'success' && result.url) {
    // Extract token from URL fragment
    // URL format: <redirectUri>#token=abc123
    const token = extractTokenFromUrl(result.url);

    if (token) {
      await saveTrelloToken(token);
      return { success: true, token };
    } else {
      throw new Error('No token received from Trello');
    }
  } else if (result.type === 'cancel') {
    return { success: false, cancelled: true };
  } else {
    throw new Error('Authorization failed');
  }
};

/**
 * Extract token from callback URL
 * Trello returns token in URL fragment: #token=abc123
 */
const extractTokenFromUrl = (url) => {
  try {
    // Handle fragment (#token=...) format
    const fragmentIndex = url.indexOf('#');
    if (fragmentIndex !== -1) {
      const fragment = url.substring(fragmentIndex + 1);
      const params = new URLSearchParams(fragment);
      return params.get('token');
    }

    // Also try query string format (?token=...) as fallback
    const urlObj = new URL(url);
    return urlObj.searchParams.get('token');
  } catch (error) {
    console.error('Error parsing token from URL:', error);
    return null;
  }
};

/**
 * Save Trello token to secure storage
 */
export const saveTrelloToken = async (token) => {
  try {
    await SecureStore.setItemAsync(TRELLO_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error saving Trello token:', error);
    throw error;
  }
};

/**
 * Get stored Trello token
 */
export const getTrelloToken = async () => {
  try {
    return await SecureStore.getItemAsync(TRELLO_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting Trello token:', error);
    return null;
  }
};

/**
 * Check if user is connected to Trello
 */
export const isTrelloConnected = async () => {
  const token = await getTrelloToken();
  return !!token;
};

/**
 * Clear Trello token (disconnect)
 */
export const disconnectTrello = async () => {
  try {
    await SecureStore.deleteItemAsync(TRELLO_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing Trello token:', error);
    throw error;
  }
};

/**
 * Validate token by making a test API call
 */
export const validateTrelloToken = async () => {
  const token = await getTrelloToken();
  if (!token) return false;

  try {
    const response = await fetch(
      `https://api.trello.com/1/members/me?key=${TRELLO_API_KEY}&token=${token}`
    );
    return response.ok;
  } catch (error) {
    console.error('Error validating Trello token:', error);
    return false;
  }
};

/**
 * Get Trello API key (for API calls)
 */
export const getTrelloApiKey = () => TRELLO_API_KEY;
