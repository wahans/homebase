/**
 * Settings Modal
 *
 * App settings including Trello integration, account info, and sign out
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { isTrelloConnected, disconnectTrello, validateTrelloToken } from '../lib/trelloAuth';
import { getImportHistory } from '../services/trelloImport';

export default function SettingsModal({
  visible,
  onClose,
  onSignOut,
  onOpenTrelloImport,
  currentUser,
  partner,
}) {
  const [trelloConnected, setTrelloConnected] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      checkTrelloStatus();
      loadImportHistory();
    }
  }, [visible]);

  const checkTrelloStatus = async () => {
    const connected = await isTrelloConnected();
    if (connected) {
      // Validate the token is still valid
      const valid = await validateTrelloToken();
      setTrelloConnected(valid);
      if (!valid) {
        // Token expired, clear it
        await disconnectTrello();
      }
    } else {
      setTrelloConnected(false);
    }
  };

  const loadImportHistory = async () => {
    try {
      const history = await getImportHistory();
      setImportHistory(history);
    } catch (error) {
      console.error('Failed to load import history:', error);
    }
  };

  const handleDisconnectTrello = () => {
    Alert.alert(
      'Disconnect Trello',
      'This will remove your Trello connection. Your imported tasks will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectTrello();
            setTrelloConnected(false);
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            if (onSignOut) onSignOut();
            onClose();
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Settings</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.modalScroll}>
          <View style={styles.modalContent}>
            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.accountCard}>
                <View style={styles.accountAvatar}>
                  <Text style={styles.accountAvatarText}>
                    {currentUser?.email?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountEmail}>{currentUser?.email || 'Not signed in'}</Text>
                  {partner && (
                    <Text style={styles.accountPartner}>
                      Partnered with {partner.display_name || partner.email}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Trello Integration Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Integrations</Text>

              <View style={styles.integrationCard}>
                <View style={styles.integrationHeader}>
                  <View style={styles.integrationIcon}>
                    <Text style={styles.integrationIconText}>T</Text>
                  </View>
                  <View style={styles.integrationInfo}>
                    <Text style={styles.integrationName}>Trello</Text>
                    <Text style={styles.integrationStatus}>
                      {trelloConnected ? 'Connected' : 'Not connected'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusDot,
                      trelloConnected ? styles.statusDotConnected : styles.statusDotDisconnected,
                    ]}
                  />
                </View>

                <Text style={styles.integrationDescription}>
                  Import your Trello boards, cards, labels, and checklists into Vectors.
                </Text>

                <View style={styles.integrationActions}>
                  <TouchableOpacity
                    style={styles.integrationButton}
                    onPress={onOpenTrelloImport}
                  >
                    <Text style={styles.integrationButtonText}>
                      {trelloConnected ? 'Import Board' : 'Connect Trello'}
                    </Text>
                  </TouchableOpacity>

                  {trelloConnected && (
                    <TouchableOpacity
                      style={styles.integrationButtonSecondary}
                      onPress={handleDisconnectTrello}
                    >
                      <Text style={styles.integrationButtonSecondaryText}>Disconnect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Import History */}
              {importHistory.length > 0 && (
                <View style={styles.historySection}>
                  <Text style={styles.historyTitle}>Import History</Text>
                  {importHistory.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <Text style={styles.historyBoardName}>{item.trello_board_name}</Text>
                      <Text style={styles.historyMeta}>
                        {item.cards_imported} tasks imported on {formatDate(item.imported_at)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Sign Out Section */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appInfoText}>Vectors v1.0.0</Text>
              <Text style={styles.appInfoText}>Made with love for busy families</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCancel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 24,
    paddingBottom: 48,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  accountPartner: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  integrationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  integrationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0079BF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  integrationIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  integrationStatus: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  statusDotDisconnected: {
    backgroundColor: '#D1D5DB',
  },
  integrationDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  integrationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  integrationButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  integrationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  integrationButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  integrationButtonSecondaryText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  historySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  historyItem: {
    paddingVertical: 8,
  },
  historyBoardName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  historyMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 24,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginVertical: 2,
  },
});
