/**
 * Trello Import Modal
 *
 * Multi-step wizard for importing Trello boards into Vectors
 * Steps: Connect -> Select Board -> Preview -> Import -> Done
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  startTrelloAuth,
  isTrelloConnected,
  disconnectTrello,
  getTrelloToken,
} from '../lib/trelloAuth';
import { getTrelloBoards, getBoardSummary } from '../lib/trelloApi';
import { importTrelloBoard, hasBeenImported } from '../services/trelloImport';

const STEPS = {
  CONNECT: 'connect',
  SELECT: 'select',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  DONE: 'done',
};

export default function TrelloImportModal({ visible, onClose, onImportComplete }) {
  const [step, setStep] = useState(STEPS.CONNECT);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardSummary, setBoardSummary] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importMessage, setImportMessage] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    if (visible) {
      checkConnection();
    }
  }, [visible]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setStep(STEPS.CONNECT);
      setSelectedBoard(null);
      setBoardSummary(null);
      setImportProgress(0);
      setImportMessage('');
      setImportResults(null);
      setError(null);
    }
  }, [visible]);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const isConnected = await isTrelloConnected();
      setConnected(isConnected);
      if (isConnected) {
        await loadBoards();
        setStep(STEPS.SELECT);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await startTrelloAuth();
      if (result.success) {
        setConnected(true);
        await loadBoards();
        setStep(STEPS.SELECT);
      } else if (result.cancelled) {
        // User cancelled, do nothing
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Trello',
      'Are you sure you want to disconnect your Trello account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectTrello();
            setConnected(false);
            setBoards([]);
            setStep(STEPS.CONNECT);
          },
        },
      ]
    );
  };

  const loadBoards = async () => {
    setLoading(true);
    try {
      const boardList = await getTrelloBoards();

      // Check which boards have been imported
      const boardsWithStatus = await Promise.all(
        boardList.map(async (board) => ({
          ...board,
          alreadyImported: await hasBeenImported(board.id),
        }))
      );

      setBoards(boardsWithStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBoard = async (board) => {
    setSelectedBoard(board);
    setLoading(true);
    setError(null);

    try {
      const summary = await getBoardSummary(board.id);
      setBoardSummary(summary);
      setStep(STEPS.PREVIEW);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedBoard) return;

    setStep(STEPS.IMPORTING);
    setImportProgress(0);
    setImportMessage('Starting import...');
    setError(null);

    try {
      const results = await importTrelloBoard(
        selectedBoard.id,
        {},
        (percent, message) => {
          setImportProgress(percent);
          setImportMessage(message);
        }
      );

      setImportResults(results);
      setStep(STEPS.DONE);

      // Notify parent to refresh data
      if (onImportComplete) {
        onImportComplete(results);
      }
    } catch (err) {
      setError(err.message);
      setStep(STEPS.PREVIEW); // Go back to preview on error
    }
  };

  const handleClose = () => {
    if (step === STEPS.IMPORTING) {
      Alert.alert(
        'Import in Progress',
        'An import is currently running. Are you sure you want to close?',
        [
          { text: 'Keep Importing', style: 'cancel' },
          { text: 'Close', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const renderConnect = () => (
    <View style={styles.stepContent}>
      <View style={styles.connectIcon}>
        <Text style={styles.connectIconText}>T</Text>
      </View>
      <Text style={styles.stepTitle}>Connect to Trello</Text>
      <Text style={styles.stepDescription}>
        Import your Trello boards, cards, labels, and checklists into Vectors.
      </Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleConnect}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Connect with Trello</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSelect = () => (
    <View style={styles.stepContentFull}>
      <Text style={styles.sectionTitle}>Select a Board to Import</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
      ) : boards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No boards found in your Trello account.</Text>
        </View>
      ) : (
        <ScrollView style={styles.boardList}>
          {boards.map((board) => (
            <TouchableOpacity
              key={board.id}
              style={[
                styles.boardItem,
                board.alreadyImported && styles.boardItemImported,
              ]}
              onPress={() => handleSelectBoard(board)}
              disabled={board.alreadyImported}
            >
              <View style={styles.boardInfo}>
                <Text style={styles.boardName}>{board.name}</Text>
                {board.alreadyImported && (
                  <Text style={styles.boardImportedBadge}>Already imported</Text>
                )}
              </View>
              <Text style={styles.boardArrow}></Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
        <Text style={styles.disconnectButtonText}>Disconnect Trello</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Import Preview</Text>
      <Text style={styles.stepSubtitle}>{selectedBoard?.name}</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#7C3AED" style={styles.loader} />
      ) : boardSummary ? (
        <View style={styles.previewStats}>
          <View style={styles.previewStat}>
            <Text style={styles.previewStatValue}>{boardSummary.cardCount}</Text>
            <Text style={styles.previewStatLabel}>Cards</Text>
          </View>
          <View style={styles.previewStat}>
            <Text style={styles.previewStatValue}>{boardSummary.labelCount}</Text>
            <Text style={styles.previewStatLabel}>Labels</Text>
          </View>
          <View style={styles.previewStat}>
            <Text style={styles.previewStatValue}>{boardSummary.checklistItemCount}</Text>
            <Text style={styles.previewStatLabel}>Checklist Items</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.previewInfo}>
        <Text style={styles.previewInfoTitle}>What will be imported:</Text>
        <Text style={styles.previewInfoItem}>Cards become tasks</Text>
        <Text style={styles.previewInfoItem}>Labels become tags (colors preserved)</Text>
        <Text style={styles.previewInfoItem}>Red/orange labels set high priority</Text>
        <Text style={styles.previewInfoItem}>Checklist items become subtasks</Text>
        <Text style={styles.previewInfoItem}>Due dates are preserved</Text>
      </View>

      <View style={styles.previewButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setStep(STEPS.SELECT)}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleImport}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>Import Board</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImporting = () => (
    <View style={styles.stepContent}>
      <ActivityIndicator size="large" color="#7C3AED" style={styles.importingSpinner} />
      <Text style={styles.stepTitle}>Importing...</Text>
      <Text style={styles.importMessage}>{importMessage}</Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${importProgress}%` }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(importProgress)}%</Text>
    </View>
  );

  const renderDone = () => (
    <View style={styles.stepContent}>
      <Text style={styles.doneIcon}>&#x2705;</Text>
      <Text style={styles.stepTitle}>Import Complete!</Text>

      {importResults && (
        <View style={styles.resultsStats}>
          <Text style={styles.resultStat}>
            {importResults.tasksImported} tasks imported
          </Text>
          <Text style={styles.resultStat}>
            {importResults.subtasksImported} subtasks imported
          </Text>
          <Text style={styles.resultStat}>
            {importResults.tagsCreated} tags created
          </Text>
        </View>
      )}

      {importResults?.errors?.length > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {importResults.errors.length} items had errors during import
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
        <Text style={styles.primaryButtonText}>Done</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => {
          setStep(STEPS.SELECT);
          loadBoards();
        }}
      >
        <Text style={styles.linkButtonText}>Import Another Board</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case STEPS.CONNECT:
        return renderConnect();
      case STEPS.SELECT:
        return renderSelect();
      case STEPS.PREVIEW:
        return renderPreview();
      case STEPS.IMPORTING:
        return renderImporting();
      case STEPS.DONE:
        return renderDone();
      default:
        return renderConnect();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.modalCancel}>
              {step === STEPS.DONE ? 'Close' : 'Cancel'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Import from Trello</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContentContainer}
        >
          {renderStep()}
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
  modalContentContainer: {
    flexGrow: 1,
  },
  stepContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContentFull: {
    flex: 1,
    padding: 24,
  },
  connectIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#0079BF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  connectIconText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  warningText: {
    color: '#D97706',
    fontSize: 14,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
  },
  linkButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '500',
  },
  disconnectButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  disconnectButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 32,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  boardList: {
    flex: 1,
  },
  boardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
  },
  boardItemImported: {
    opacity: 0.5,
  },
  boardInfo: {
    flex: 1,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  boardImportedBadge: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  boardArrow: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7C3AED',
  },
  previewStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  previewInfo: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 10,
    marginBottom: 32,
  },
  previewInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  previewInfoItem: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 2,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  importingSpinner: {
    marginBottom: 24,
  },
  importMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  doneIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultsStats: {
    marginVertical: 24,
    alignItems: 'center',
  },
  resultStat: {
    fontSize: 16,
    color: '#374151',
    marginVertical: 4,
  },
});
