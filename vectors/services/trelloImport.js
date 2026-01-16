/**
 * Trello Import Service
 *
 * Handles the transformation and import of Trello board data into Vectors
 * Follows existing patterns from TaskListScreen.js for consistency
 */

import { supabase } from '../lib/supabase';
import { fetchBoardForImport } from '../lib/trelloApi';

/**
 * Trello label colors mapped to Vectors tag colors
 */
const TRELLO_COLOR_MAP = {
  'red': '#EF4444',
  'orange': '#F97316',
  'yellow': '#F59E0B',
  'lime': '#84CC16',
  'green': '#10B981',
  'sky': '#0EA5E9',
  'blue': '#3B82F6',
  'purple': '#8B5CF6',
  'pink': '#EC4899',
  'black': '#374151',
  null: '#6B7280', // No color = gray
};

/**
 * Infer priority from Trello label color
 */
const inferPriorityFromColor = (color) => {
  if (color === 'red' || color === 'orange') return 'high';
  if (color === 'yellow') return 'medium';
  return null; // Don't set priority for other colors
};

/**
 * Map Trello list name to Vectors status
 */
const mapListToStatus = (listName) => {
  const normalized = listName.toLowerCase();

  // Done/Complete variations
  if (normalized.includes('done') ||
      normalized.includes('complete') ||
      normalized.includes('finished') ||
      normalized.includes('shipped')) {
    return 'done';
  }

  // In Progress variations
  if (normalized.includes('doing') ||
      normalized.includes('progress') ||
      normalized.includes('working') ||
      normalized.includes('active') ||
      normalized.includes('current')) {
    return 'in_progress';
  }

  // Default to todo
  return 'todo';
};

/**
 * Import a Trello board into Vectors
 *
 * @param {string} trelloBoardId - Trello board ID to import
 * @param {object} options - Import options
 * @param {function} onProgress - Progress callback (percent, message)
 * @returns {object} Import results summary
 */
export const importTrelloBoard = async (trelloBoardId, options = {}, onProgress = () => {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const results = {
    boardCreated: null,
    tasksImported: 0,
    subtasksImported: 0,
    tagsCreated: 0,
    errors: [],
  };

  try {
    // Step 1: Fetch all Trello data (20% progress)
    onProgress(10, 'Fetching Trello board data...');
    const trelloData = await fetchBoardForImport(trelloBoardId);
    onProgress(20, `Found ${trelloData.summary.cardCount} cards to import`);

    // Step 2: Create Vectors board (30% progress)
    onProgress(25, 'Creating board...');
    const vectorsBoard = await createVectorsBoard(trelloData.board, user.id);
    results.boardCreated = vectorsBoard;
    onProgress(30, `Board "${vectorsBoard.name}" created`);

    // Step 3: Create/match tags from Trello labels (40% progress)
    onProgress(35, 'Setting up tags...');
    const tagMapping = await createTagsFromLabels(trelloData.labels, user.id);
    results.tagsCreated = Object.keys(tagMapping.created).length;
    onProgress(40, `${results.tagsCreated} tags created`);

    // Step 4: Import cards as tasks (40-80% progress)
    onProgress(45, 'Importing tasks...');
    const taskResults = await importCardsAsTasks(
      trelloData.cards,
      vectorsBoard.id,
      tagMapping,
      user.id,
      (taskPercent) => onProgress(45 + (taskPercent * 0.35), `Importing tasks... ${Math.round(taskPercent)}%`)
    );
    results.tasksImported = taskResults.imported;
    results.errors.push(...taskResults.errors);
    onProgress(80, `${results.tasksImported} tasks imported`);

    // Step 5: Import checklists as subtasks (80-95% progress)
    onProgress(85, 'Importing subtasks from checklists...');
    const subtaskResults = await importChecklistsAsSubtasks(
      trelloData.cards,
      taskResults.cardToTaskMap,
      (subtaskPercent) => onProgress(85 + (subtaskPercent * 0.10), `Importing subtasks... ${Math.round(subtaskPercent)}%`)
    );
    results.subtasksImported = subtaskResults.imported;
    results.errors.push(...subtaskResults.errors);
    onProgress(95, `${results.subtasksImported} subtasks imported`);

    // Step 6: Log import to history (100% progress)
    onProgress(98, 'Saving import record...');
    await logImport(trelloBoardId, trelloData.board.name, vectorsBoard.id, results, user.id);
    onProgress(100, 'Import complete!');

    return results;

  } catch (error) {
    console.error('Trello import error:', error);
    results.errors.push({ type: 'fatal', message: error.message });
    throw error;
  }
};

/**
 * Create a Vectors board from Trello board data
 */
const createVectorsBoard = async (trelloBoard, userId) => {
  // Map Trello board background color to Vectors color (or use default)
  const boardColor = trelloBoard.prefs?.backgroundColor || '#3B82F6';

  const { data, error } = await supabase
    .from('boards')
    .insert([{
      name: trelloBoard.name,
      user_id: userId,
      color: boardColor,
      icon: '📋', // Default icon
      sort_order: 0, // Will be updated by app
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create board: ${error.message}`);
  return data;
};

/**
 * Create Vectors tags from Trello labels
 * Returns mapping of Trello label ID -> Vectors tag ID
 */
const createTagsFromLabels = async (trelloLabels, userId) => {
  // First, fetch existing tags to avoid duplicates
  const { data: existingTags } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId);

  const existingTagsByName = {};
  (existingTags || []).forEach(tag => {
    existingTagsByName[tag.name.toLowerCase()] = tag;
  });

  const mapping = {
    created: {},
    existing: {},
  };

  for (const label of trelloLabels) {
    // Skip labels without names
    if (!label.name) continue;

    const labelNameLower = label.name.toLowerCase();

    // Check if tag already exists
    if (existingTagsByName[labelNameLower]) {
      mapping.existing[label.id] = existingTagsByName[labelNameLower].id;
      continue;
    }

    // Create new tag
    const vectorsColor = TRELLO_COLOR_MAP[label.color] || TRELLO_COLOR_MAP[null];

    const { data, error } = await supabase
      .from('tags')
      .insert([{
        name: label.name,
        color: vectorsColor,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) {
      console.warn(`Failed to create tag "${label.name}":`, error.message);
      continue;
    }

    mapping.created[label.id] = data.id;
    existingTagsByName[labelNameLower] = data;
  }

  return mapping;
};

/**
 * Import Trello cards as Vectors tasks
 */
const importCardsAsTasks = async (cards, boardId, tagMapping, userId, onProgress) => {
  const results = {
    imported: 0,
    errors: [],
    cardToTaskMap: {}, // Trello card ID -> Vectors task ID
  };

  const total = cards.length;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    try {
      // Map Trello labels to Vectors tags
      const tagIds = [];
      let priority = 'none';

      if (card.labels && card.labels.length > 0) {
        for (const label of card.labels) {
          // Check for priority inference
          const inferredPriority = inferPriorityFromColor(label.color);
          if (inferredPriority && priority === 'none') {
            priority = inferredPriority;
          }

          // Map to Vectors tag
          const vectorsTagId = tagMapping.created[label.id] || tagMapping.existing[label.id];
          if (vectorsTagId) {
            tagIds.push(vectorsTagId);
          }
        }
      }

      // Map list name to status
      const status = mapListToStatus(card.listName);

      // Create task
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: card.name,
          description: card.desc || null,
          user_id: userId,
          completed: card.dueComplete || false,
          assigned_to: 'me', // Default to current user
          due_date: card.due || null,
          priority: priority,
          status: status,
          tags: tagIds.length > 0 ? tagIds : null,
          board_id: boardId,
          recurring: 'none',
          sort_order: i, // Preserve Trello card order
        }])
        .select()
        .single();

      if (error) {
        results.errors.push({ card: card.name, message: error.message });
        continue;
      }

      results.cardToTaskMap[card.id] = data.id;
      results.imported++;

    } catch (error) {
      results.errors.push({ card: card.name, message: error.message });
    }

    // Report progress
    onProgress(((i + 1) / total) * 100);
  }

  return results;
};

/**
 * Import Trello checklists as Vectors subtasks
 */
const importChecklistsAsSubtasks = async (cards, cardToTaskMap, onProgress) => {
  const results = {
    imported: 0,
    errors: [],
  };

  // Collect all checklist items to import
  const subtasksToImport = [];

  for (const card of cards) {
    const taskId = cardToTaskMap[card.id];
    if (!taskId) continue;

    for (const checklist of card.checklists || []) {
      for (const item of checklist.checkItems || []) {
        subtasksToImport.push({
          task_id: taskId,
          title: item.name,
          completed: item.state === 'complete',
          sort_order: item.pos,
        });
      }
    }
  }

  if (subtasksToImport.length === 0) {
    onProgress(100);
    return results;
  }

  // Batch insert subtasks (in chunks to avoid hitting limits)
  const BATCH_SIZE = 50;

  for (let i = 0; i < subtasksToImport.length; i += BATCH_SIZE) {
    const batch = subtasksToImport.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('subtasks')
      .insert(batch);

    if (error) {
      results.errors.push({ batch: i, message: error.message });
    } else {
      results.imported += batch.length;
    }

    onProgress(((i + batch.length) / subtasksToImport.length) * 100);
  }

  return results;
};

/**
 * Log import to trello_imports table
 */
const logImport = async (trelloBoardId, trelloBoardName, vectorsBoardId, results, userId) => {
  try {
    await supabase
      .from('trello_imports')
      .insert([{
        user_id: userId,
        trello_board_id: trelloBoardId,
        trello_board_name: trelloBoardName,
        vectors_board_id: vectorsBoardId,
        cards_imported: results.tasksImported,
      }]);
  } catch (error) {
    // Non-fatal - import succeeded even if logging fails
    console.warn('Failed to log import:', error.message);
  }
};

/**
 * Check if a Trello board has already been imported
 */
export const hasBeenImported = async (trelloBoardId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('trello_imports')
    .select('id')
    .eq('user_id', user.id)
    .eq('trello_board_id', trelloBoardId)
    .single();

  return !!data;
};

/**
 * Get list of previously imported boards
 */
export const getImportHistory = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('trello_imports')
    .select('*')
    .eq('user_id', user.id)
    .order('imported_at', { ascending: false });

  return data || [];
};
