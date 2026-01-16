/**
 * Trello API Wrapper
 *
 * Handles all Trello API calls for importing boards, lists, cards, and checklists
 */

import { getTrelloToken, getTrelloApiKey } from './trelloAuth';

const TRELLO_API_BASE = 'https://api.trello.com/1';

/**
 * Make authenticated request to Trello API
 */
const trelloFetch = async (endpoint, options = {}) => {
  const token = await getTrelloToken();
  const apiKey = getTrelloApiKey();

  if (!token || !apiKey) {
    throw new Error('Trello not connected. Please connect your Trello account first.');
  }

  // Add auth params to URL
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${TRELLO_API_BASE}${endpoint}${separator}key=${apiKey}&token=${token}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Trello authorization expired. Please reconnect your account.');
    }
    throw new Error(`Trello API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get current user's Trello profile
 */
export const getTrelloMember = async () => {
  return trelloFetch('/members/me?fields=id,fullName,username,email,avatarUrl');
};

/**
 * Get all boards for the current user
 */
export const getTrelloBoards = async () => {
  return trelloFetch('/members/me/boards?fields=id,name,desc,dateLastActivity,prefs,closed&filter=open');
};

/**
 * Get a specific board by ID
 */
export const getTrelloBoard = async (boardId) => {
  return trelloFetch(`/boards/${boardId}?fields=id,name,desc,prefs`);
};

/**
 * Get all lists for a board
 */
export const getTrelloLists = async (boardId) => {
  return trelloFetch(`/boards/${boardId}/lists?fields=id,name,pos,closed&filter=open`);
};

/**
 * Get all cards for a board (includes labels)
 */
export const getTrelloCards = async (boardId) => {
  return trelloFetch(
    `/boards/${boardId}/cards?fields=id,name,desc,due,dueComplete,idList,labels,pos,closed&filter=open`
  );
};

/**
 * Get all labels for a board
 */
export const getTrelloLabels = async (boardId) => {
  return trelloFetch(`/boards/${boardId}/labels?fields=id,name,color`);
};

/**
 * Get checklists for a card
 */
export const getTrelloCardChecklists = async (cardId) => {
  return trelloFetch(`/cards/${cardId}/checklists?fields=id,name,pos&checkItems=all&checkItem_fields=name,pos,state`);
};

/**
 * Get all checklists for a board (batch operation)
 */
export const getTrelloBoardChecklists = async (boardId) => {
  return trelloFetch(`/boards/${boardId}/checklists?fields=id,name,idCard,pos&checkItems=all&checkItem_fields=name,pos,state`);
};

/**
 * Fetch complete board data for import (optimized batch fetch)
 * Returns all data needed to import a board in minimum API calls
 */
export const fetchBoardForImport = async (boardId) => {
  // Fetch all data in parallel
  const [board, lists, cards, checklists, labels] = await Promise.all([
    getTrelloBoard(boardId),
    getTrelloLists(boardId),
    getTrelloCards(boardId),
    getTrelloBoardChecklists(boardId),
    getTrelloLabels(boardId),
  ]);

  // Create lookup maps for efficient access
  const listsById = {};
  lists.forEach(list => {
    listsById[list.id] = list;
  });

  // Group checklists by card ID
  const checklistsByCardId = {};
  checklists.forEach(checklist => {
    if (!checklistsByCardId[checklist.idCard]) {
      checklistsByCardId[checklist.idCard] = [];
    }
    checklistsByCardId[checklist.idCard].push(checklist);
  });

  // Enrich cards with list name and checklists
  const enrichedCards = cards.map(card => ({
    ...card,
    listName: listsById[card.idList]?.name || 'Unknown',
    checklists: checklistsByCardId[card.id] || [],
  }));

  return {
    board,
    lists,
    cards: enrichedCards,
    labels,
    summary: {
      cardCount: cards.length,
      listCount: lists.length,
      labelCount: labels.length,
      checklistCount: checklists.length,
      checklistItemCount: checklists.reduce(
        (sum, cl) => sum + (cl.checkItems?.length || 0),
        0
      ),
    },
  };
};

/**
 * Get board summary for preview (lightweight fetch)
 */
export const getBoardSummary = async (boardId) => {
  const [board, cards, checklists] = await Promise.all([
    getTrelloBoard(boardId),
    getTrelloCards(boardId),
    getTrelloBoardChecklists(boardId),
  ]);

  const checklistItemCount = checklists.reduce(
    (sum, cl) => sum + (cl.checkItems?.length || 0),
    0
  );

  // Count unique labels across all cards
  const uniqueLabels = new Set();
  cards.forEach(card => {
    card.labels?.forEach(label => uniqueLabels.add(label.id));
  });

  return {
    boardName: board.name,
    cardCount: cards.length,
    labelCount: uniqueLabels.size,
    checklistItemCount,
  };
};
