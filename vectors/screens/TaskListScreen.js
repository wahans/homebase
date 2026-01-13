import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  Share,
  Clipboard,
  RefreshControl
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import DateTimePicker from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function TaskListScreen() {
  const insets = useSafeAreaInsets();

  // Core state
  const [tasks, setTasks] = useState([]);
  const [displayTasks, setDisplayTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Sections visibility
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Grouping / Swimlanes
  const [groupBy, setGroupBy] = useState('none'); // 'none'|'assignee'|'priority'|'status'|'dueDate'
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showGroupByPicker, setShowGroupByPicker] = useState(false);
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  // Boards
  const [boards, setBoards] = useState([]);
  const [currentBoard, setCurrentBoard] = useState(null); // null = inbox/all
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('#3B82F6');
  const [newBoardIcon, setNewBoardIcon] = useState('📋');
  
  // Calendar
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  
  // Tags
  const [tags, setTags] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');
  const [filterByTag, setFilterByTag] = useState(null);
  
  // Subtasks
  const [subtasks, setSubtasks] = useState({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);
  
  // Activity Log
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Partner
  const [partner, setPartner] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [partnerDisplayName, setPartnerDisplayName] = useState('');
  
  // Add task modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskAssignment, setNewTaskAssignment] = useState('me');
  const [newTaskDueDate, setNewTaskDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTaskPriority, setNewTaskPriority] = useState('none');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskRecurring, setNewTaskRecurring] = useState('none');
  const [newTaskTags, setNewTaskTags] = useState([]);
  const [newTaskSubtasks, setNewTaskSubtasks] = useState([]);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');

  // Edit task modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskAssignment, setEditTaskAssignment] = useState('me');
  const [editTaskDueDate, setEditTaskDueDate] = useState(null);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editTaskPriority, setEditTaskPriority] = useState('none');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskRecurring, setEditTaskRecurring] = useState('none');
  const [editTaskTags, setEditTaskTags] = useState([]);
  const [editTaskStatus, setEditTaskStatus] = useState('todo');

  const swipeableRefs = useRef({});

  // ==================== INITIALIZATION ====================
  
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      await Promise.all([
        fetchTasks(),
        fetchTags(),
        fetchTemplates(),
        fetchPartner(),
        fetchBoards()
      ]);
    } catch (error) {
      console.error('Init error:', error);
    } finally {
      setLoading(false);
    }
    
    // Subscribe to real-time changes
    const taskSubscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        handleTaskChange
      )
      .subscribe();

    const subtaskSubscription = supabase
      .channel('subtasks_channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subtasks' },
        handleSubtaskChange
      )
      .subscribe();

    return () => {
      taskSubscription.unsubscribe();
      subtaskSubscription.unsubscribe();
    };
  };

  const handleTaskChange = (payload) => {
    if (payload.eventType === 'INSERT') {
      setTasks(current => [payload.new, ...current]);
    } else if (payload.eventType === 'DELETE') {
      setTasks(current => current.filter(task => task.id !== payload.old.id));
    } else if (payload.eventType === 'UPDATE') {
      setTasks(current => 
        current.map(task => task.id === payload.new.id ? payload.new : task)
      );
    }
  };

  const handleSubtaskChange = (payload) => {
    const taskId = payload.new?.task_id || payload.old?.task_id;
    if (taskId) {
      fetchSubtasksForTask(taskId);
    }
  };

  useEffect(() => {
    applyFilterAndSort();
  }, [tasks, filter, sortBy, searchQuery, filterByTag, showCompleted, showArchived, groupBy, collapsedGroups, currentBoard]);

  // ==================== DATA FETCHING ====================

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch tasks error:', error);
    } else {
      setTasks(data || []);
      const taskIds = (data || []).map(t => t.id);
      if (taskIds.length > 0) {
        fetchAllSubtasks(taskIds);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, []);

  const fetchAllSubtasks = async (taskIds) => {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      const grouped = {};
      data.forEach(st => {
        if (!grouped[st.task_id]) grouped[st.task_id] = [];
        grouped[st.task_id].push(st);
      });
      setSubtasks(grouped);
    }
  };

  const fetchSubtasksForTask = async (taskId) => {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true });

    if (!error) {
      setSubtasks(current => ({
        ...current,
        [taskId]: data || []
      }));
    }
  };

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setTags(data);
    }
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .order('name', { ascending: true });

    if (!error && data) {
      setTemplates(data);
    }
  };

  const fetchBoards = async () => {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setBoards(data);
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('boards')
      .insert([{
        name: newBoardName.trim(),
        user_id: user.id,
        color: newBoardColor,
        icon: newBoardIcon,
        sort_order: boards.length
      }])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setBoards([...boards, data]);
      setNewBoardName('');
      setNewBoardColor('#3B82F6');
      setNewBoardIcon('📋');
      setShowBoardModal(false);
    }
  };

  const deleteBoard = async (boardId) => {
    Alert.alert(
      'Delete Board',
      'Are you sure? Tasks in this board will be moved to Inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // First, move all tasks in this board to inbox (board_id = null)
            await supabase
              .from('tasks')
              .update({ board_id: null })
              .eq('board_id', boardId);

            // Then delete the board
            const { error } = await supabase
              .from('boards')
              .delete()
              .eq('id', boardId);

            if (!error) {
              setBoards(boards.filter(b => b.id !== boardId));
              if (currentBoard?.id === boardId) {
                setCurrentBoard(null);
              }
              fetchTasks(); // Refresh tasks
            }
          }
        }
      ]
    );
  };

  const fetchPartner = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('partnerships')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (!error && data) {
      const isUser1 = data.user1_id === user.id;
      setPartner({
        id: isUser1 ? data.user2_id : data.user1_id,
        displayName: isUser1 ? data.user2_display_name : data.user1_display_name,
        myDisplayName: isUser1 ? data.user1_display_name : data.user2_display_name,
        partnershipId: data.id
      });
    }
  };

  const fetchActivityLog = async (taskId) => {
    setActivityLoading(true);
    setActivityLog([]);
    
    try {
      const { data, error } = await supabase
        .from('task_activity')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Activity fetch error:', error);
        // Show helpful message if table doesn't exist
        if (error.code === '42P01') {
          Alert.alert('Setup Required', 'Please run the database schema update (vectors-schema-update.sql) in Supabase.');
        }
      } else {
        setActivityLog(data || []);
      }
    } catch (e) {
      console.error('Activity fetch exception:', e);
    } finally {
      setActivityLoading(false);
    }
  };

  // ==================== FILTER & SORT ====================

  const applyFilterAndSort = () => {
    let result = [...tasks];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Filter by current board
    if (currentBoard) {
      result = result.filter(task => task.board_id === currentBoard.id);
    }

    if (filterByTag) {
      result = result.filter(task => 
        task.tags && task.tags.some(t => Number(t) === Number(filterByTag))
      );
    }
    
    if (filter === 'completed') {
      const completedTasks = result.filter(task => task.completed && !task.archived);
      setDisplayTasks(completedTasks.map(task => ({ type: 'task', data: task })));
      return;
    }

    if (filter === 'archived') {
      const archivedTasks = result.filter(task => task.archived);
      setDisplayTasks(archivedTasks.map(task => ({ type: 'task', data: task })));
      return;
    }
    
    // Separate by status
    let incompleteTasks = result.filter(task => !task.completed && !task.archived);
    const completedTasks = result.filter(task => task.completed && !task.archived);
    const archivedTasks = result.filter(task => task.archived);
    
    // Apply assignment filter
    if (filter !== 'all') {
      incompleteTasks = incompleteTasks.filter(task => task.assigned_to === filter);
    }
    
    const isOverdue = (task) => {
      if (!task.due_date || task.completed) return false;
      return new Date(task.due_date) < new Date();
    };
    
    // Sort incomplete tasks
    if (sortBy === 'due') {
      incompleteTasks.sort((a, b) => {
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 2, low: 3, none: 4 };
      incompleteTasks.sort((a, b) => {
        const getDaysOverdue = (task) => {
          if (!task.due_date || task.completed) return 0;
          const diffTime = new Date() - new Date(task.due_date);
          return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        };
        const aIsVeryOverdue = getDaysOverdue(a) >= 3 && (a.priority || 'none') !== 'high';
        const bIsVeryOverdue = getDaysOverdue(b) >= 3 && (b.priority || 'none') !== 'high';
        const getEffectivePriority = (task, isVeryOverdue) => {
          if ((task.priority || 'none') === 'high') return 0;
          if (isVeryOverdue) return 1;
          return priorityOrder[task.priority || 'none'];
        };
        return getEffectivePriority(a, aIsVeryOverdue) - getEffectivePriority(b, bIsVeryOverdue);
      });
    } else if (sortBy === 'manual') {
      // Sort by sort_order for manual drag-and-drop ordering
      incompleteTasks.sort((a, b) => {
        const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder === bOrder) {
          // Fall back to created_at for tasks without sort_order
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return aOrder - bOrder;
      });
    } else {
      incompleteTasks.sort((a, b) => {
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    
    // Build display list with section headers
    const displayList = [];

    // Handle grouping (swimlanes)
    if (groupBy !== 'none') {
      const groups = groupTasksByField(incompleteTasks, groupBy);
      groups.forEach(group => {
        displayList.push({
          type: 'swimlane',
          groupKey: group.key,
          title: group.title,
          color: group.color,
          count: group.tasks.length,
          isCollapsed: collapsedGroups[group.key] || false
        });
        if (!collapsedGroups[group.key]) {
          group.tasks.forEach(task => {
            displayList.push({ type: 'task', data: task });
          });
        }
      });
    } else {
      incompleteTasks.forEach(task => {
        displayList.push({ type: 'task', data: task });
      });
    }

    if (completedTasks.length > 0) {
      displayList.push({ type: 'section', title: `Completed (${completedTasks.length})`, section: 'completed' });
      if (showCompleted) {
        completedTasks.forEach(task => {
          displayList.push({ type: 'task', data: task });
        });
      }
    }

    if (archivedTasks.length > 0) {
      displayList.push({ type: 'section', title: `Archived (${archivedTasks.length})`, section: 'archived' });
      if (showArchived) {
        archivedTasks.forEach(task => {
          displayList.push({ type: 'task', data: task });
        });
      }
    }

    setDisplayTasks(displayList);
  };

  // ==================== ACTIVITY LOGGING ====================

  const logActivity = async (taskId, action, details = {}) => {
    if (!currentUser) {
      console.warn('No current user for activity logging');
      return;
    }
    
    try {
      const { error } = await supabase.from('task_activity').insert([{
        task_id: taskId,
        user_id: currentUser.id,
        user_email: currentUser.email,
        action,
        details
      }]);
      
      if (error) {
        console.error('Activity log error:', error);
      }
    } catch (e) {
      console.error('Activity log exception:', e);
    }
  };

  // ==================== TASK CRUD ====================

  const quickAddTask = async () => {
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const assignment = filter === 'all' ? 'me' : filter;
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title: newTask.trim(),
        user_id: user.id,
        completed: false,
        assigned_to: assignment,
        status: 'todo',
        board_id: currentBoard?.id || null
      }])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewTask('');
      logActivity(data.id, 'created', { title: newTask.trim() });
    }
  };

  const addTaskWithAssignment = async () => {
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title: newTask.trim(),
        user_id: user.id,
        completed: false,
        assigned_to: newTaskAssignment,
        due_date: newTaskDueDate,
        priority: newTaskPriority,
        description: newTaskDescription.trim() || null,
        recurring: newTaskRecurring,
        tags: newTaskTags.length > 0 ? newTaskTags : null,
        status: newTaskStatus,
        board_id: currentBoard?.id || null
      }])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      if (newTaskSubtasks.length > 0) {
        const subtasksToInsert = newTaskSubtasks.map((st, idx) => ({
          task_id: data.id,
          title: st.title,
          completed: false,
          sort_order: idx
        }));
        await supabase.from('subtasks').insert(subtasksToInsert);
      }
      
      logActivity(data.id, 'created', { 
        title: newTask.trim(),
        assigned_to: newTaskAssignment,
        priority: newTaskPriority
      });
      
      resetAddModal();
    }
  };

  const resetAddModal = () => {
    setNewTask('');
    setNewTaskAssignment('me');
    setNewTaskDueDate(null);
    setNewTaskPriority('none');
    setNewTaskDescription('');
    setNewTaskRecurring('none');
    setNewTaskTags([]);
    setNewTaskSubtasks([]);
    setNewTaskStatus('todo');
    setShowAddModal(false);
  };

  const confirmDeleteTask = (taskId, taskTitle) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask(taskId) }
      ]
    );
  };

  const deleteTask = async (taskId) => {
    if (swipeableRefs.current[taskId]) {
      swipeableRefs.current[taskId].close();
    }
    
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) Alert.alert('Error', error.message);
  };

  const archiveTask = async (taskId) => {
    if (swipeableRefs.current[taskId]) {
      swipeableRefs.current[taskId].close();
    }
    
    const { error } = await supabase
      .from('tasks')
      .update({ archived: true })
      .eq('id', taskId);

    if (!error) {
      logActivity(taskId, 'archived', {});
    }
  };

  const unarchiveTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .update({ archived: false })
      .eq('id', taskId);

    if (!error) {
      logActivity(taskId, 'unarchived', {});
    }
  };

  const toggleTask = async (task) => {
    const newCompletedState = !task.completed;
    
    const { error } = await supabase
      .from('tasks')
      .update({ completed: newCompletedState })
      .eq('id', task.id);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    logActivity(task.id, newCompletedState ? 'completed' : 'uncompleted', {});

    if (newCompletedState && task.recurring && task.recurring !== 'none' && task.due_date) {
      await createNextRecurringTask(task);
    }
  };

  const createNextRecurringTask = async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    const currentDueDate = new Date(task.due_date);
    
    switch (task.recurring) {
      case 'daily': currentDueDate.setDate(currentDueDate.getDate() + 1); break;
      case 'weekly': currentDueDate.setDate(currentDueDate.getDate() + 7); break;
      case 'monthly': currentDueDate.setMonth(currentDueDate.getMonth() + 1); break;
      default: return;
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title: task.title,
        user_id: user.id,
        completed: false,
        assigned_to: task.assigned_to,
        due_date: currentDueDate.toISOString(),
        priority: task.priority,
        description: task.description,
        recurring: task.recurring,
        tags: task.tags
      }])
      .select()
      .single();

    if (!error && data) {
      const taskSubtasks = subtasks[task.id] || [];
      if (taskSubtasks.length > 0) {
        const newSubtasks = taskSubtasks.map((st, idx) => ({
          task_id: data.id,
          title: st.title,
          completed: false,
          sort_order: idx
        }));
        await supabase.from('subtasks').insert(newSubtasks);
      }
      
      logActivity(data.id, 'created', { title: task.title, recurring: true });
    }
  };

  // Handle drag-and-drop reordering
  const onDragEnd = useCallback(async ({ data: reorderedData, from, to }) => {
    if (from === to) return;

    // Update local state immediately for responsive UI
    setDisplayTasks(reorderedData);

    // Extract just the tasks (not section headers) and update their sort_order
    const tasksToUpdate = reorderedData
      .filter(item => item.type === 'task')
      .map((item, index) => ({
        id: item.data.id,
        sort_order: index
      }));

    // Update each task's sort_order in the database
    try {
      for (const task of tasksToUpdate) {
        await supabase
          .from('tasks')
          .update({ sort_order: task.sort_order })
          .eq('id', task.id);
      }

      // Update local tasks state to reflect new order
      setTasks(currentTasks =>
        currentTasks.map(t => {
          const updated = tasksToUpdate.find(u => u.id === t.id);
          return updated ? { ...t, sort_order: updated.sort_order } : t;
        })
      );
    } catch (error) {
      console.error('Error updating sort order:', error);
      Alert.alert('Error', 'Failed to save new order');
      // Refresh to restore original order
      fetchTasks();
    }
  }, []);

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskAssignment(task.assigned_to || 'me');
    setEditTaskDueDate(task.due_date);
    setEditTaskPriority(task.priority || 'none');
    setEditTaskDescription(task.description || '');
    setEditTaskRecurring(task.recurring || 'none');
    setEditTaskTags(task.tags || []);
    setEditTaskStatus(task.status || 'todo');
    setNewSubtaskTitle('');
    setShowEditModal(true);
  };

  const updateTask = async () => {
    if (!editTaskTitle.trim()) return;

    const oldTask = editingTask;
    const changes = [];
    
    if (oldTask.title !== editTaskTitle.trim()) changes.push(`title: "${editTaskTitle.trim()}"`);
    if (oldTask.assigned_to !== editTaskAssignment) changes.push(`assigned: ${editTaskAssignment}`);
    if (oldTask.priority !== editTaskPriority) changes.push(`priority: ${editTaskPriority}`);
    if (oldTask.status !== editTaskStatus) changes.push(`status: ${editTaskStatus}`);

    const updates = {
      title: editTaskTitle.trim(),
      assigned_to: editTaskAssignment,
      due_date: editTaskDueDate,
      priority: editTaskPriority,
      description: editTaskDescription.trim() || null,
      recurring: editTaskRecurring,
      tags: editTaskTags.length > 0 ? editTaskTags : null,
      status: editTaskStatus,
    };

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', editingTask.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      logActivity(editingTask.id, 'updated', { changes: changes.join(', ') || 'task details' });
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  // ==================== SUBTASKS ====================

  const addSubtask = async (taskId, title) => {
    if (!title.trim()) return;
    
    const currentSubtasks = subtasks[taskId] || [];
    const { error } = await supabase
      .from('subtasks')
      .insert([{
        task_id: taskId,
        title: title.trim(),
        completed: false,
        sort_order: currentSubtasks.length
      }]);

    if (!error) {
      fetchSubtasksForTask(taskId);
      logActivity(taskId, 'subtask_added', { subtask: title.trim() });
    }
  };

  const toggleSubtask = async (subtask) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ 
        completed: !subtask.completed,
        completed_at: !subtask.completed ? new Date().toISOString() : null
      })
      .eq('id', subtask.id);

    if (!error) {
      fetchSubtasksForTask(subtask.task_id);
      logActivity(subtask.task_id, subtask.completed ? 'subtask_uncompleted' : 'subtask_completed', 
        { subtask: subtask.title });
    }
  };

  const deleteSubtask = async (subtaskId, taskId) => {
    await supabase.from('subtasks').delete().eq('id', subtaskId);
    fetchSubtasksForTask(taskId);
  };

  // ==================== TEMPLATES ====================

  const saveAsTemplate = async (task) => {
    const templateName = task.title;
    const { data: { user } } = await supabase.auth.getUser();
    const taskSubtasks = subtasks[task.id] || [];

    const { error } = await supabase
      .from('task_templates')
      .insert([{
        user_id: user.id,
        name: templateName,
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to,
        priority: task.priority,
        recurring: task.recurring,
        tags: task.tags,
        subtasks: taskSubtasks.map(st => ({ title: st.title }))
      }]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', `Template "${templateName}" saved!`);
      fetchTemplates();
    }
  };

  const createFromTemplate = async (template) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title: template.title,
        user_id: user.id,
        completed: false,
        assigned_to: template.assigned_to || 'me',
        priority: template.priority || 'none',
        description: template.description,
        recurring: template.recurring || 'none',
        tags: template.tags
      }])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      const templateSubtasks = template.subtasks || [];
      if (templateSubtasks.length > 0) {
        const subtasksToInsert = templateSubtasks.map((st, idx) => ({
          task_id: data.id,
          title: st.title,
          completed: false,
          sort_order: idx
        }));
        await supabase.from('subtasks').insert(subtasksToInsert);
      }

      logActivity(data.id, 'created', { title: template.title, from_template: template.name });
      Alert.alert('Success', `Task "${template.title}" created!`);
      setShowCreateFromTemplate(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    Alert.alert(
      'Delete Template',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await supabase.from('task_templates').delete().eq('id', templateId);
            fetchTemplates();
          }
        }
      ]
    );
  };

  // ==================== PARTNER ====================

  const generateInviteCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (partner) {
      Alert.alert('Already Partnered', 'You already have a partner connected.');
      return;
    }

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const { error } = await supabase
      .from('partner_invitations')
      .insert([{
        inviter_id: user.id,
        inviter_email: user.email,
        invite_code: code
      }]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setInviteCode(code);
    }
  };

  const shareInviteCode = async () => {
    const message = `Join me on Vectors! Use this code to connect: ${inviteCode}`;
    try {
      await Share.share({ message });
    } catch (error) {
      Clipboard.setString(inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    }
  };

  const copyInviteCode = () => {
    Clipboard.setString(inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard.');
  };

  const acceptInvite = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: invite, error: findError } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('invite_code', joinCode.toUpperCase())
      .is('accepted_at', null)
      .single();

    if (findError || !invite) {
      Alert.alert('Error', 'Invalid or expired invite code.');
      return;
    }

    if (invite.inviter_id === user.id) {
      Alert.alert('Error', "You can't accept your own invitation.");
      return;
    }

    const { error: partnerError } = await supabase
      .from('partnerships')
      .insert([{
        user1_id: invite.inviter_id,
        user2_id: user.id,
        user1_display_name: 'Partner',
        user2_display_name: 'Partner'
      }]);

    if (partnerError) {
      Alert.alert('Error', partnerError.message);
      return;
    }

    await supabase
      .from('partner_invitations')
      .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
      .eq('id', invite.id);

    Alert.alert('Success', 'You are now connected as partners!');
    setJoinCode('');
    fetchPartner();
    setShowPartnerModal(false);
  };

  const updateDisplayName = async () => {
    if (!partner || !partnerDisplayName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: partnership } = await supabase
      .from('partnerships')
      .select('*')
      .eq('id', partner.partnershipId)
      .single();

    if (partnership) {
      const isUser1 = partnership.user1_id === user.id;
      const field = isUser1 ? 'user1_display_name' : 'user2_display_name';
      
      await supabase
        .from('partnerships')
        .update({ [field]: partnerDisplayName.trim() })
        .eq('id', partner.partnershipId);

      fetchPartner();
      Alert.alert('Updated', 'Display name updated!');
    }
  };

  // ==================== TAGS ====================

  const createTag = async () => {
    if (!newTagName.trim()) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('tags')
      .insert([{
        name: newTagName.trim(),
        color: newTagColor,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTags(current => [...current, data]);
      setNewTagName('');
    }
  };

  const deleteTag = async (tagId) => {
    await supabase.from('tags').delete().eq('id', tagId);
    setTags(current => current.filter(t => t.id !== tagId));
  };

  // ==================== HELPERS ====================

  const getAssignmentColor = (assignment) => {
    switch (assignment) {
      case 'me': return '#7C3AED';
      case 'you': return '#EC4899';
      case 'us': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#EAB308';
      default: return '#6B7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'None';
    }
  };

  const getAssignmentLabel = (assignment) => {
    if (assignment === 'you' && partner?.displayName) {
      return partner.displayName;
    }
    switch (assignment) {
      case 'me': return 'Me';
      case 'you': return 'You';
      case 'us': return 'Us';
      default: return 'Unassigned';
    }
  };

  const getRecurringLabel = (recurring) => {
    switch (recurring) {
      case 'daily': return '🔄 Daily';
      case 'weekly': return '🔄 Weekly';
      case 'monthly': return '🔄 Monthly';
      default: return null;
    }
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Today', isOverdue: false };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', isOverdue: false };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d`, isOverdue: false };
    } else {
      return { 
        text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        isOverdue: false 
      };
    }
  };

  const formatActivityTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityDescription = (activity) => {
    const user = activity.user_email?.split('@')[0] || 'Someone';
    switch (activity.action) {
      case 'created': return `${user} created this task`;
      case 'completed': return `${user} completed this task`;
      case 'uncompleted': return `${user} marked as incomplete`;
      case 'updated': return `${user} updated ${activity.details?.changes || 'this task'}`;
      case 'archived': return `${user} archived this task`;
      case 'unarchived': return `${user} restored this task`;
      case 'subtask_added': return `${user} added subtask "${activity.details?.subtask}"`;
      case 'subtask_completed': return `${user} completed "${activity.details?.subtask}"`;
      case 'subtask_uncompleted': return `${user} uncompleted "${activity.details?.subtask}"`;
      default: return `${user} ${activity.action}`;
    }
  };

  const getSubtaskProgress = (taskId) => {
    const taskSubtasks = subtasks[taskId] || [];
    if (taskSubtasks.length === 0) return null;
    const completed = taskSubtasks.filter(st => st.completed).length;
    return { completed, total: taskSubtasks.length };
  };

  // Status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return '#F59E0B';
      case 'done': return '#10B981';
      case 'todo':
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      case 'todo':
      default: return 'To Do';
    }
  };

  // Sorting helpers
  const sortByLabels = {
    manual: 'Manual',
    created: 'Newest',
    due: 'Due',
    priority: 'Priority'
  };

  // Grouping helpers
  const groupByLabels = {
    none: 'None',
    assignee: 'Assignee',
    priority: 'Priority',
    status: 'Status',
    dueDate: 'Due Date'
  };

  const getDueDateGroup = (dueDate) => {
    if (!dueDate) return 'no_date';
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'this_week';
    return 'later';
  };

  const getGroupKey = (task, field) => {
    switch (field) {
      case 'assignee': return task.assigned_to || 'unassigned';
      case 'priority': return task.priority || 'none';
      case 'status': return task.status || 'todo';
      case 'dueDate': return getDueDateGroup(task.due_date);
      default: return 'all';
    }
  };

  const getGroupTitle = (key, field) => {
    switch (field) {
      case 'assignee':
        if (key === 'me') return 'Me';
        if (key === 'you') return partner?.displayName || 'Partner';
        if (key === 'us') return 'Us';
        return 'Unassigned';
      case 'priority':
        return key.charAt(0).toUpperCase() + key.slice(1);
      case 'status':
        return getStatusLabel(key);
      case 'dueDate':
        if (key === 'overdue') return 'Overdue';
        if (key === 'today') return 'Today';
        if (key === 'this_week') return 'This Week';
        if (key === 'later') return 'Later';
        return 'No Due Date';
      default:
        return 'All Tasks';
    }
  };

  const getGroupColor = (key, field) => {
    switch (field) {
      case 'assignee':
        return getAssignmentColor(key);
      case 'priority':
        return getPriorityColor(key);
      case 'status':
        return getStatusColor(key);
      case 'dueDate':
        if (key === 'overdue') return '#EF4444';
        if (key === 'today') return '#F59E0B';
        if (key === 'this_week') return '#3B82F6';
        if (key === 'later') return '#6B7280';
        return '#9CA3AF';
      default:
        return '#6B7280';
    }
  };

  const getGroupSortOrder = (key, field) => {
    switch (field) {
      case 'assignee':
        return { me: 0, you: 1, us: 2, unassigned: 3 }[key] ?? 99;
      case 'priority':
        return { high: 0, medium: 1, low: 2, none: 3 }[key] ?? 99;
      case 'status':
        return { in_progress: 0, todo: 1, done: 2 }[key] ?? 99;
      case 'dueDate':
        return { overdue: 0, today: 1, this_week: 2, later: 3, no_date: 4 }[key] ?? 99;
      default:
        return 0;
    }
  };

  const groupTasksByField = (tasksToGroup, field) => {
    const groups = {};
    tasksToGroup.forEach(task => {
      const key = getGroupKey(task, field);
      if (!groups[key]) {
        groups[key] = {
          key,
          title: getGroupTitle(key, field),
          color: getGroupColor(key, field),
          sortOrder: getGroupSortOrder(key, field),
          tasks: []
        };
      }
      groups[key].tasks.push(task);
    });

    return Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Calendar helpers
  const getCalendarDays = () => {
    const year = selectedCalendarDate.getFullYear();
    const month = selectedCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, date: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, date: new Date(year, month, day) });
    }
    return days;
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return new Date(task.due_date).toISOString().split('T')[0] === dateStr;
    });
  };

  const changeMonth = (delta) => {
    const newDate = new Date(selectedCalendarDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedCalendarDate(newDate);
  };

  // Swipe actions
  const renderRightActions = useCallback((progress, dragX, taskId, taskTitle) => {
    return (
      <TouchableOpacity style={styles.swipeDeleteButton} onPress={() => confirmDeleteTask(taskId, taskTitle)}>
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    );
  }, []);

  const renderLeftActions = useCallback((progress, dragX, taskId, isArchived) => {
    return (
      <TouchableOpacity style={styles.swipeArchiveButton} onPress={() => isArchived ? unarchiveTask(taskId) : archiveTask(taskId)}>
        <Text style={styles.swipeArchiveText}>{isArchived ? 'Restore' : 'Archive'}</Text>
      </TouchableOpacity>
    );
  }, []);

  const onSwipeableOpen = useCallback((direction, taskId, taskTitle, isArchived) => {
    setTimeout(() => {
      if (direction === 'right') {
        deleteTask(taskId);
      } else if (direction === 'left') {
        isArchived ? unarchiveTask(taskId) : archiveTask(taskId);
      }
    }, 50);
  }, []);

  // ==================== RENDER ITEM ====================

  const renderItem = useCallback(({ item }) => {
    if (item.type === 'section') {
      return (
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => item.section === 'completed' ? setShowCompleted(!showCompleted) : setShowArchived(!showArchived)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionHeaderText}>{item.title}</Text>
          <Text style={styles.sectionHeaderArrow}>
            {(item.section === 'completed' ? showCompleted : showArchived) ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.type === 'swimlane') {
      return (
        <TouchableOpacity
          style={[styles.swimlaneHeader, { backgroundColor: item.color }]}
          onPress={() => toggleGroupCollapse(item.groupKey)}
          activeOpacity={0.8}
        >
          <View style={styles.swimlaneLeft}>
            <Text style={styles.swimlaneTitle}>{item.title}</Text>
            <View style={styles.swimlaneCount}>
              <Text style={styles.swimlaneCountText}>{item.count}</Text>
            </View>
          </View>
          <Text style={styles.swimlaneArrow}>{item.isCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
      );
    }

    // Safety check for task data
    if (!item.data) return null;

    const task = item.data;
    const assignmentColor = getAssignmentColor(task.assigned_to);
    const dueDateInfo = formatDueDate(task.due_date);
    const priorityColor = getPriorityColor(task.priority || 'none');
    const priorityLabel = getPriorityLabel(task.priority || 'none');
    const recurringLabel = getRecurringLabel(task.recurring);
    const taskTags = task.tags || [];
    const progress = getSubtaskProgress(task.id);

    const isOverdue = dueDateInfo?.isOverdue && !task.completed;

    // Get background tint based on assignment
    const getRowBackground = (assignment) => {
      switch (assignment) {
        case 'me': return '#7C3AED08';
        case 'you': return '#EC489908';
        case 'us': return '#10B98108';
        default: return '#FFFFFF';
      }
    };

    // Get subtasks for this task
    const taskSubtasks = subtasks[task.id] || [];

    return (
      <Swipeable
        ref={ref => { if (ref) swipeableRefs.current[task.id] = ref; }}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, task.id, task.title)}
        renderLeftActions={(progress, dragX) => renderLeftActions(progress, dragX, task.id, task.archived)}
        rightThreshold={40}
        leftThreshold={40}
        overshootRight={false}
        overshootLeft={false}
        onSwipeableOpen={(direction) => onSwipeableOpen(direction, task.id, task.title, task.archived)}
        containerStyle={styles.rowContainer}
      >
        <View
          style={[
            styles.taskRow,
            { backgroundColor: getRowBackground(task.assigned_to) },
            task.completed && styles.taskRowCompleted
          ]}
        >
          {/* Checkbox */}
          <TouchableOpacity
            style={[
              styles.rowCheckbox,
              task.completed && styles.rowCheckboxChecked,
              { borderColor: assignmentColor }
            ]}
            onPress={() => toggleTask(task)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {task.completed && <Text style={styles.rowCheckmark}>✓</Text>}
          </TouchableOpacity>

          {/* Main content area - tappable */}
          <TouchableOpacity
            style={styles.rowContent}
            onPress={() => openEditModal(task)}
            activeOpacity={0.6}
          >
            {/* Line 1: Title + tag dots + metadata pills */}
            <View style={styles.rowLine1}>
              <Text
                style={[styles.rowTitle, task.completed && styles.rowTitleCompleted]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {taskTags.length > 0 && (
                <View style={styles.rowTagDotsInline}>
                  {taskTags.slice(0, 3).map(tagId => {
                    const tag = tags.find(t => t.id === tagId || t.id === Number(tagId));
                    if (!tag) return null;
                    return (
                      <View key={tagId} style={[styles.rowTagMini, { backgroundColor: tag.color }]} />
                    );
                  })}
                </View>
              )}
              <View style={styles.rowInlineMeta}>
                {task.priority && task.priority !== 'none' && (
                  <View style={[styles.rowPriorityBadge, { backgroundColor: priorityColor }]}>
                    <Text style={styles.rowPriorityBadgeText}>{task.priority === 'high' ? '!!' : '!'}</Text>
                  </View>
                )}
                {dueDateInfo && (
                  <Text style={[styles.rowDueInline, isOverdue && styles.rowDueInlineOverdue]}>
                    {dueDateInfo.text}
                  </Text>
                )}
                {recurringLabel && <Text style={styles.rowRecurringInline}>↻</Text>}
              </View>
            </View>

            {/* Line 2: Description + subtasks */}
            {(task.description || taskSubtasks.length > 0) && (
              <View style={styles.rowLine2}>
                {task.description && (
                  <Text style={styles.rowDescriptionInline} numberOfLines={1}>
                    {task.description.substring(0, 120)}
                  </Text>
                )}
                {taskSubtasks.length > 0 && (
                  <Text style={styles.rowSubtaskCount}>☑{progress?.completed || 0}/{taskSubtasks.length}</Text>
                )}
              </View>
            )}

            {/* Line 3: Inline subtasks if any */}
            {taskSubtasks.length > 0 && (
              <View style={styles.rowSubtasksRow}>
                {taskSubtasks.slice(0, 4).map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={styles.miniSubtaskCompact}
                    onPress={() => toggleSubtask(st)}
                  >
                    <View style={[styles.miniSubtaskBox, st.completed && styles.miniSubtaskBoxChecked]}>
                      {st.completed && <Text style={styles.miniSubtaskTick}>✓</Text>}
                    </View>
                    <Text style={[styles.miniSubtaskLabel, st.completed && styles.miniSubtaskLabelDone]} numberOfLines={1}>
                      {st.title}
                    </Text>
                  </TouchableOpacity>
                ))}
                {taskSubtasks.length > 4 && (
                  <Text style={styles.moreSubtasks}>+{taskSubtasks.length - 4}</Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          {/* Quick actions - horizontal on far right */}
          <View style={styles.rowActionsRow}>
            <TouchableOpacity style={styles.rowActionBtn} onPress={() => openEditModal(task)}>
              <Text style={styles.rowActionTxt}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rowActionBtn}
              onPress={() => {
                const nextAssign = task.assigned_to === 'me' ? 'you' : task.assigned_to === 'you' ? 'us' : 'me';
                supabase.from('tasks').update({ assigned_to: nextAssign }).eq('id', task.id);
              }}
            >
              <Text style={[styles.rowActionTxt, { color: assignmentColor }]}>⟳</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rowActionBtn} onPress={() => confirmDeleteTask(task.id, task.title)}>
              <Text style={[styles.rowActionTxt, { color: '#EF4444' }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Swipeable>
    );
  }, [tags, subtasks, showCompleted, showArchived, partner]);

  const keyExtractor = useCallback((item, index) => {
    if (item.type === 'section') return `section-${item.section}`;
    if (item.type === 'swimlane') return `swimlane-${item.groupKey}`;
    return `task-${item.data?.id || index}`;
  }, []);

  // Draggable render item for manual sorting mode
  const renderDraggableItem = useCallback(({ item, drag, isActive }) => {
    if (item.type === 'section') {
      return (
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => item.section === 'completed' ? setShowCompleted(!showCompleted) : setShowArchived(!showArchived)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionHeaderText}>{item.title}</Text>
          <Text style={styles.sectionHeaderArrow}>
            {(item.section === 'completed' ? showCompleted : showArchived) ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (item.type === 'swimlane') {
      return (
        <TouchableOpacity
          style={[styles.swimlaneHeader, { backgroundColor: item.color }]}
          onPress={() => toggleGroupCollapse(item.groupKey)}
          activeOpacity={0.8}
        >
          <View style={styles.swimlaneLeft}>
            <Text style={styles.swimlaneTitle}>{item.title}</Text>
            <View style={styles.swimlaneCount}>
              <Text style={styles.swimlaneCountText}>{item.count}</Text>
            </View>
          </View>
          <Text style={styles.swimlaneArrow}>{item.isCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
      );
    }

    // Safety check for task data
    if (!item.data) return null;

    const task = item.data;
    const assignmentColor = getAssignmentColor(task.assigned_to);
    const dueDateInfo = formatDueDate(task.due_date);
    const priorityColor = getPriorityColor(task.priority || 'none');
    const priorityLabel = getPriorityLabel(task.priority || 'none');
    const recurringLabel = getRecurringLabel(task.recurring);
    const taskTags = task.tags || [];
    const progress = getSubtaskProgress(task.id);

    const isOverdue = dueDateInfo?.isOverdue && !task.completed;

    // Get background tint based on assignment
    const getRowBackground = (assignment) => {
      switch (assignment) {
        case 'me': return '#7C3AED08';
        case 'you': return '#EC489908';
        case 'us': return '#10B98108';
        default: return '#FFFFFF';
      }
    };

    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[
            styles.taskRowDraggable,
            { backgroundColor: getRowBackground(task.assigned_to) },
            task.completed && styles.taskRowCompleted,
            isActive && styles.taskRowDragging
          ]}
          onPress={() => openEditModal(task)}
          onLongPress={drag}
          delayLongPress={150}
          activeOpacity={0.6}
        >
          {/* Drag handle */}
          <TouchableOpacity
            style={styles.rowDragHandle}
            onPressIn={drag}
            delayLongPress={0}
          >
            <Text style={styles.rowDragHandleText}>⋮⋮</Text>
          </TouchableOpacity>

          {/* Checkbox */}
          <TouchableOpacity
            style={[
              styles.rowCheckbox,
              task.completed && styles.rowCheckboxChecked,
              { borderColor: assignmentColor }
            ]}
            onPress={() => toggleTask(task)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {task.completed && <Text style={styles.rowCheckmark}>✓</Text>}
          </TouchableOpacity>

          {/* Main content area */}
          <View style={styles.rowContent}>
            {/* Top line: Title + Assignment */}
            <View style={styles.rowTopLine}>
              <Text
                style={[styles.rowTitle, task.completed && styles.rowTitleCompleted]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
            </View>

            {/* Description preview */}
            {task.description && (
              <Text style={styles.rowDescription} numberOfLines={1}>
                {task.description.substring(0, 60)}{task.description.length > 60 ? '...' : ''}
              </Text>
            )}

            {/* Bottom line: Metadata */}
            <View style={styles.rowBottomLine}>
              {/* Priority pill */}
              {task.priority && task.priority !== 'none' && (
                <View style={[styles.rowPriorityPill, { backgroundColor: priorityColor }]}>
                  <Text style={styles.rowPriorityPillText}>{priorityLabel}</Text>
                </View>
              )}

              {/* Due date pill */}
              {dueDateInfo && (
                <View style={[styles.rowDatePill, isOverdue && styles.rowDatePillOverdue]}>
                  <Text style={[styles.rowDatePillText, isOverdue && styles.rowDatePillTextOverdue]}>
                    {dueDateInfo.text}
                  </Text>
                </View>
              )}

              {/* Recurring indicator */}
              {recurringLabel && (
                <View style={styles.rowRecurringPill}>
                  <Text style={styles.rowRecurringPillText}>↻ {recurringLabel}</Text>
                </View>
              )}

              {/* Tags as colored pills */}
              {taskTags.length > 0 && taskTags.slice(0, 2).map(tagId => {
                const tag = tags.find(t => t.id === tagId || t.id === Number(tagId));
                if (!tag) return null;
                return (
                  <View key={tagId} style={[styles.rowTagPill, { backgroundColor: tag.color + '20' }]}>
                    <View style={[styles.rowTagDotInline, { backgroundColor: tag.color }]} />
                    <Text style={[styles.rowTagPillText, { color: tag.color }]}>{tag.name}</Text>
                  </View>
                );
              })}

              {/* Subtask progress */}
              {progress && (
                <View style={styles.rowSubtaskPill}>
                  <Text style={styles.rowSubtaskText}>☑ {progress.completed}/{progress.total}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, [tags, subtasks, showCompleted, showArchived, partner]);

  // ==================== MAIN RENDER ====================

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#EBE5FF', '#E0D9FE', '#F0EDF8']}
        locations={[0, 0.5, 1]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerBrand}>
          <View style={styles.headerLogoIcon}>
            <View style={styles.headerLogoArrow1} />
            <View style={styles.headerLogoArrow2} />
          </View>
          <Text style={styles.headerTitle}>vectors</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.headerButton, showSearch && styles.headerButtonActive]} onPress={() => setShowSearch(!showSearch)}>
            <Text style={styles.headerButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowCalendar(true)}>
            <Text style={styles.headerButtonText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowCreateFromTemplate(true)}>
            <Text style={styles.headerButtonText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowPartnerModal(true)}>
            <Text style={styles.headerButtonText}>{partner ? '👫' : '👤'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.searchClear} onPress={() => setSearchQuery('')}>
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Board Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.boardSelectorContainer} contentContainerStyle={styles.boardSelectorContent}>
        <TouchableOpacity
          style={[styles.boardTab, !currentBoard && styles.boardTabActive]}
          onPress={() => setCurrentBoard(null)}
        >
          <Text style={[styles.boardTabText, !currentBoard && styles.boardTabTextActive]}>📥 Inbox</Text>
        </TouchableOpacity>
        {boards.map(board => (
          <TouchableOpacity
            key={board.id}
            style={[styles.boardTab, currentBoard?.id === board.id && styles.boardTabActive, currentBoard?.id === board.id && { backgroundColor: board.color }]}
            onPress={() => setCurrentBoard(board)}
            onLongPress={() => deleteBoard(board.id)}
          >
            <Text style={[styles.boardTabText, currentBoard?.id === board.id && styles.boardTabTextActive]}>
              {board.icon} {board.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addBoardTab} onPress={() => setShowBoardModal(true)}>
          <Text style={styles.addBoardTabText}>+ Board</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Status Filters */}
      <View style={styles.statusFilters}>
        <TouchableOpacity
          style={[styles.statusFilterButton, filter === 'completed' && styles.statusFilterButtonActive]}
          onPress={() => setFilter(filter === 'completed' ? 'all' : 'completed')}
        >
          <Text style={[styles.statusFilterText, filter === 'completed' && styles.statusFilterTextActive]}>✅ Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusFilterButton, filter === 'archived' && styles.statusFilterButtonActive]}
          onPress={() => setFilter(filter === 'archived' ? 'all' : 'archived')}
        >
          <Text style={[styles.statusFilterText, filter === 'archived' && styles.statusFilterTextActive]}>📦 Archived</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusFilterButton} onPress={() => setShowTagModal(true)}>
          <Text style={styles.statusFilterText}>🏷️ Tags</Text>
        </TouchableOpacity>
        {filterByTag && (
          <TouchableOpacity style={[styles.statusFilterButton, styles.statusFilterButtonActive]} onPress={() => setFilterByTag(null)}>
            <Text style={styles.statusFilterTextActive}>✕ {tags.find(t => t.id === filterByTag)?.name}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort, Group & View Toggle */}
      <View style={styles.sortGroupRow}>
        {/* Sort By Dropdown */}
        <View style={styles.sortByWrapper}>
          <Text style={styles.sortByLabel}>Sort:</Text>
          <TouchableOpacity
            style={styles.sortByDropdown}
            onPress={() => { setShowSortPicker(!showSortPicker); setShowGroupByPicker(false); }}
          >
            <Text style={styles.sortByDropdownText}>{sortByLabels[sortBy]}</Text>
            <Text style={styles.sortByDropdownArrow}>{showSortPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showSortPicker && (
            <View style={styles.sortByDropdownMenu}>
              {Object.entries(sortByLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.sortByMenuItem, sortBy === key && styles.sortByMenuItemActive]}
                  onPress={() => { setSortBy(key); setShowSortPicker(false); }}
                >
                  <Text style={[styles.sortByMenuItemText, sortBy === key && styles.sortByMenuItemTextActive]}>{label}</Text>
                  {sortBy === key && <Text style={styles.sortByMenuItemCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.viewControls}>
          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>☰</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, viewMode === 'kanban' && styles.viewToggleBtnActive]}
              onPress={() => { setViewMode('kanban'); if (groupBy === 'none') setGroupBy('status'); }}
            >
              <Text style={[styles.viewToggleText, viewMode === 'kanban' && styles.viewToggleTextActive]}>▦</Text>
            </TouchableOpacity>
          </View>
          {/* Group By Dropdown */}
          <View style={styles.groupByWrapper}>
            <Text style={styles.groupByLabel}>Group:</Text>
            <TouchableOpacity
              style={styles.groupByDropdown}
              onPress={() => { setShowGroupByPicker(!showGroupByPicker); setShowSortPicker(false); }}
            >
              <Text style={styles.groupByDropdownText}>{groupByLabels[groupBy]}</Text>
              <Text style={styles.groupByDropdownArrow}>{showGroupByPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showGroupByPicker && (
              <View style={styles.groupByDropdownMenu}>
                {Object.entries(groupByLabels).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.groupByMenuItem, groupBy === key && styles.groupByMenuItemActive]}
                    onPress={() => { setGroupBy(key); setShowGroupByPicker(false); }}
                  >
                    <Text style={[styles.groupByMenuItemText, groupBy === key && styles.groupByMenuItemTextActive]}>{label}</Text>
                    {groupBy === key && <Text style={styles.groupByMenuItemCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Quick Add */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Quick add task..."
          placeholderTextColor="#9CA3AF"
          value={newTask}
          onChangeText={setNewTask}
          onSubmitEditing={quickAddTask}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={quickAddTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailedAddButton} onPress={() => { setNewTaskAssignment(filter === 'all' ? 'me' : filter); setShowAddModal(true); }}>
          <Text style={styles.detailedAddButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Task List or Kanban View */}
      {viewMode === 'kanban' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.kanbanContainer}
          contentContainerStyle={styles.kanbanContent}
        >
          {(() => {
            // Get incomplete tasks only for kanban
            const incompleteTasks = tasks.filter(t => !t.completed && !t.archived && (!currentBoard || t.board_id === currentBoard?.id));
            const groupField = groupBy === 'none' ? 'status' : groupBy;
            const groups = groupTasksByField(incompleteTasks, groupField);

            return groups.map(group => (
              <View key={group.key} style={styles.kanbanColumn}>
                <View style={[styles.kanbanColumnHeader, { backgroundColor: group.color }]}>
                  <Text style={styles.kanbanColumnTitle}>{group.title}</Text>
                  <View style={styles.kanbanColumnCount}>
                    <Text style={styles.kanbanColumnCountText}>{group.tasks.length}</Text>
                  </View>
                </View>
                <ScrollView style={styles.kanbanColumnBody} showsVerticalScrollIndicator={false}>
                  {group.tasks.map(task => {
                    const assignmentColor = getAssignmentColor(task.assigned_to);
                    const dueDateInfo = formatDueDate(task.due_date);
                    return (
                      <TouchableOpacity
                        key={task.id}
                        style={styles.kanbanCard}
                        onPress={() => openEditModal(task)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.kanbanCardHeader}>
                          <TouchableOpacity
                            style={[styles.kanbanCardCheckbox, { borderColor: assignmentColor }]}
                            onPress={() => toggleTask(task)}
                          >
                            {task.completed && <Text style={styles.kanbanCardCheckmark}>✓</Text>}
                          </TouchableOpacity>
                          <View style={[styles.kanbanCardAssignment, { backgroundColor: assignmentColor }]}>
                            <Text style={styles.kanbanCardAssignmentText}>
                              {task.assigned_to === 'me' ? 'M' : task.assigned_to === 'you' ? 'Y' : 'U'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.kanbanCardTitle} numberOfLines={2}>{task.title}</Text>
                        {task.description && (
                          <Text style={styles.kanbanCardDesc} numberOfLines={2}>{task.description}</Text>
                        )}
                        <View style={styles.kanbanCardMeta}>
                          {task.priority && task.priority !== 'none' && (
                            <View style={[styles.kanbanCardPriority, { backgroundColor: getPriorityColor(task.priority) }]}>
                              <Text style={styles.kanbanCardPriorityText}>{task.priority === 'high' ? '!!' : '!'}</Text>
                            </View>
                          )}
                          {dueDateInfo && (
                            <Text style={[styles.kanbanCardDue, dueDateInfo.isOverdue && styles.kanbanCardDueOverdue]}>
                              {dueDateInfo.text}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {group.tasks.length === 0 && (
                    <View style={styles.kanbanEmptyColumn}>
                      <Text style={styles.kanbanEmptyText}>No tasks</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            ));
          })()}
        </ScrollView>
      ) : sortBy === 'manual' ? (
        <DraggableFlatList
          data={displayTasks}
          renderItem={renderDraggableItem}
          keyExtractor={keyExtractor}
          onDragEnd={onDragEnd}
          contentContainerStyle={styles.taskListContentManual}
          ItemSeparatorComponent={null}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🎯</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No tasks match your search' : 'No tasks yet. Add one above!'}
              </Text>
              <Text style={styles.emptyStateSubtext}>Long press and drag to reorder tasks</Text>
            </View>
          }
          activationDistance={10}
        />
      ) : (
        <FlatList
          data={displayTasks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.taskListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🎯</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No tasks match your search' : 'No tasks yet. Add one above!'}
              </Text>
            </View>
          }
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>built with ❤️ by the homebase team</Text>
      </View>

      {/* ==================== MODALS ==================== */}

      {/* Add Task Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAddModal}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={resetAddModal}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Task</Text>
            <TouchableOpacity onPress={addTaskWithAssignment} disabled={!newTask.trim()}>
              <Text style={[styles.modalDone, !newTask.trim() && styles.modalDoneDisabled]}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Task</Text>
                <TextInput style={styles.formInput} placeholder="What needs to be done?" placeholderTextColor="#9CA3AF" value={newTask} onChangeText={setNewTask} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput style={[styles.formInput, styles.formTextArea]} placeholder="Add notes..." placeholderTextColor="#9CA3AF" value={newTaskDescription} onChangeText={setNewTaskDescription} multiline numberOfLines={3} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Subtasks</Text>
                {newTaskSubtasks.map((st, idx) => (
                  <View key={idx} style={styles.subtaskRow}>
                    <Text style={styles.subtaskBullet}>•</Text>
                    <Text style={styles.subtaskText}>{st.title}</Text>
                    <TouchableOpacity onPress={() => setNewTaskSubtasks(newTaskSubtasks.filter((_, i) => i !== idx))}>
                      <Text style={styles.subtaskRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.subtaskAddRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1 }]}
                    placeholder="Add subtask..."
                    placeholderTextColor="#9CA3AF"
                    value={newSubtaskTitle}
                    onChangeText={setNewSubtaskTitle}
                    onSubmitEditing={() => {
                      if (newSubtaskTitle.trim()) {
                        setNewTaskSubtasks([...newTaskSubtasks, { title: newSubtaskTitle.trim() }]);
                        setNewSubtaskTitle('');
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.subtaskAddButton}
                    onPress={() => {
                      if (newSubtaskTitle.trim()) {
                        setNewTaskSubtasks([...newTaskSubtasks, { title: newSubtaskTitle.trim() }]);
                        setNewSubtaskTitle('');
                      }
                    }}
                  >
                    <Text style={styles.subtaskAddButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Assign To</Text>
                <View style={styles.assignmentButtons}>
                  {['me', 'you', 'us'].map(assign => (
                    <TouchableOpacity
                      key={assign}
                      style={[styles.assignmentButton, newTaskAssignment === assign && { backgroundColor: getAssignmentColor(assign), borderColor: getAssignmentColor(assign) }]}
                      onPress={() => setNewTaskAssignment(assign)}
                    >
                      <Text style={[styles.assignmentButtonText, newTaskAssignment === assign && styles.assignmentButtonTextActive]}>
                        {assign === 'you' && partner?.displayName ? partner.displayName : assign.charAt(0).toUpperCase() + assign.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.assignmentButtons}>
                  {['none', 'low', 'medium', 'high'].map(priority => (
                    <TouchableOpacity
                      key={priority}
                      style={[styles.assignmentButton, newTaskPriority === priority && { backgroundColor: getPriorityColor(priority), borderColor: getPriorityColor(priority) }]}
                      onPress={() => setNewTaskPriority(priority)}
                    >
                      <Text style={[styles.assignmentButtonText, newTaskPriority === priority && styles.assignmentButtonTextActive]}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.assignmentButtons}>
                  {[{key: 'todo', label: 'To Do', color: '#6B7280'}, {key: 'in_progress', label: 'In Progress', color: '#F59E0B'}, {key: 'done', label: 'Done', color: '#10B981'}].map(s => (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.assignmentButton, newTaskStatus === s.key && { backgroundColor: s.color, borderColor: s.color }]}
                      onPress={() => setNewTaskStatus(s.key)}
                    >
                      <Text style={[styles.assignmentButtonText, newTaskStatus === s.key && styles.assignmentButtonTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Recurring</Text>
                <View style={styles.assignmentButtons}>
                  {['none', 'daily', 'weekly', 'monthly'].map(rec => (
                    <TouchableOpacity
                      key={rec}
                      style={[styles.assignmentButton, newTaskRecurring === rec && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }]}
                      onPress={() => setNewTaskRecurring(rec)}
                    >
                      <Text style={[styles.assignmentButtonText, newTaskRecurring === rec && styles.assignmentButtonTextActive]}>{rec.charAt(0).toUpperCase() + rec.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tags</Text>
                <View style={styles.tagSelectList}>
                  {tags.map(tag => {
                    const isSelected = newTaskTags.includes(tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[styles.tagSelectItem, { borderColor: tag.color }, isSelected && { backgroundColor: tag.color + '20' }]}
                        onPress={() => isSelected ? setNewTaskTags(newTaskTags.filter(t => t !== tag.id)) : setNewTaskTags([...newTaskTags, tag.id])}
                      >
                        <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                        <Text style={[styles.tagSelectText, { color: tag.color }]}>{tag.name}</Text>
                        {isSelected && <Text style={{ color: tag.color, marginLeft: 4 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date</Text>
                <View style={styles.quickDateButtons}>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => setNewTaskDueDate(new Date().toISOString())}>
                    <Text style={styles.quickDateButtonText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => { const d = new Date(); d.setDate(d.getDate() + 1); setNewTaskDueDate(d.toISOString()); }}>
                    <Text style={styles.quickDateButtonText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => { const d = new Date(); d.setDate(d.getDate() + 7); setNewTaskDueDate(d.toISOString()); }}>
                    <Text style={styles.quickDateButtonText}>1 Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.quickDateButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>
                {newTaskDueDate && (
                  <View style={styles.selectedDateContainer}>
                    <Text style={styles.selectedDateText}>Due: {new Date(newTaskDueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    <TouchableOpacity onPress={() => setNewTaskDueDate(null)}><Text style={styles.clearDateButtonText}>Clear</Text></TouchableOpacity>
                  </View>
                )}
              </View>

              {showDatePicker && (
                <DateTimePicker value={newTaskDueDate ? new Date(newTaskDueDate) : new Date()} mode="date" display="default" onChange={(e, date) => { setShowDatePicker(false); if (date) setNewTaskDueDate(date.toISOString()); }} />
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Task Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TouchableOpacity onPress={updateTask} disabled={!editTaskTitle.trim()}>
              <Text style={[styles.modalDone, !editTaskTitle.trim() && styles.modalDoneDisabled]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Task</Text>
                <TextInput style={styles.formInput} value={editTaskTitle} onChangeText={setEditTaskTitle} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput style={[styles.formInput, styles.formTextArea]} value={editTaskDescription} onChangeText={setEditTaskDescription} multiline numberOfLines={3} />
              </View>

              {editingTask && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Subtasks</Text>
                  {(subtasks[editingTask.id] || []).map(st => (
                    <View key={st.id} style={styles.subtaskRow}>
                      <TouchableOpacity onPress={() => toggleSubtask(st)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={st.completed ? styles.subtaskChecked : styles.subtaskUnchecked}>{st.completed ? '☑' : '☐'}</Text>
                      </TouchableOpacity>
                      <Text style={[styles.subtaskText, st.completed && styles.subtaskTextCompleted]}>{st.title}</Text>
                      <TouchableOpacity onPress={() => deleteSubtask(st.id, editingTask.id)}>
                        <Text style={styles.subtaskRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.subtaskAddRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      placeholder="Add subtask..."
                      placeholderTextColor="#9CA3AF"
                      value={newSubtaskTitle}
                      onChangeText={setNewSubtaskTitle}
                      onSubmitEditing={() => {
                        if (newSubtaskTitle.trim() && editingTask) {
                          addSubtask(editingTask.id, newSubtaskTitle);
                          setNewSubtaskTitle('');
                        }
                      }}
                    />
                    <TouchableOpacity style={styles.subtaskAddButton} onPress={() => { if (newSubtaskTitle.trim() && editingTask) { addSubtask(editingTask.id, newSubtaskTitle); setNewSubtaskTitle(''); } }}>
                      <Text style={styles.subtaskAddButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Assign To</Text>
                <View style={styles.assignmentButtons}>
                  {['me', 'you', 'us'].map(assign => (
                    <TouchableOpacity
                      key={assign}
                      style={[styles.assignmentButton, editTaskAssignment === assign && { backgroundColor: getAssignmentColor(assign), borderColor: getAssignmentColor(assign) }]}
                      onPress={() => setEditTaskAssignment(assign)}
                    >
                      <Text style={[styles.assignmentButtonText, editTaskAssignment === assign && styles.assignmentButtonTextActive]}>
                        {assign === 'you' && partner?.displayName ? partner.displayName : assign.charAt(0).toUpperCase() + assign.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.assignmentButtons}>
                  {['none', 'low', 'medium', 'high'].map(priority => (
                    <TouchableOpacity
                      key={priority}
                      style={[styles.assignmentButton, editTaskPriority === priority && { backgroundColor: getPriorityColor(priority), borderColor: getPriorityColor(priority) }]}
                      onPress={() => setEditTaskPriority(priority)}
                    >
                      <Text style={[styles.assignmentButtonText, editTaskPriority === priority && styles.assignmentButtonTextActive]}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.assignmentButtons}>
                  {[{key: 'todo', label: 'To Do', color: '#6B7280'}, {key: 'in_progress', label: 'In Progress', color: '#F59E0B'}, {key: 'done', label: 'Done', color: '#10B981'}].map(s => (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.assignmentButton, editTaskStatus === s.key && { backgroundColor: s.color, borderColor: s.color }]}
                      onPress={() => setEditTaskStatus(s.key)}
                    >
                      <Text style={[styles.assignmentButtonText, editTaskStatus === s.key && styles.assignmentButtonTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Recurring</Text>
                <View style={styles.assignmentButtons}>
                  {['none', 'daily', 'weekly', 'monthly'].map(rec => (
                    <TouchableOpacity
                      key={rec}
                      style={[styles.assignmentButton, editTaskRecurring === rec && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }]}
                      onPress={() => setEditTaskRecurring(rec)}
                    >
                      <Text style={[styles.assignmentButtonText, editTaskRecurring === rec && styles.assignmentButtonTextActive]}>{rec.charAt(0).toUpperCase() + rec.slice(1)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tags</Text>
                <View style={styles.tagSelectList}>
                  {tags.map(tag => {
                    const isSelected = editTaskTags.some(t => Number(t) === Number(tag.id));
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        style={[styles.tagSelectItem, { borderColor: tag.color }, isSelected && { backgroundColor: tag.color + '20' }]}
                        onPress={() => isSelected ? setEditTaskTags(editTaskTags.filter(t => Number(t) !== Number(tag.id))) : setEditTaskTags([...editTaskTags, tag.id])}
                      >
                        <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                        <Text style={[styles.tagSelectText, { color: tag.color }]}>{tag.name}</Text>
                        {isSelected && <Text style={{ color: tag.color, marginLeft: 4 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date</Text>
                <View style={styles.quickDateButtons}>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => setEditTaskDueDate(new Date().toISOString())}>
                    <Text style={styles.quickDateButtonText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => { const d = new Date(); d.setDate(d.getDate() + 1); setEditTaskDueDate(d.toISOString()); }}>
                    <Text style={styles.quickDateButtonText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => { const d = new Date(); d.setDate(d.getDate() + 7); setEditTaskDueDate(d.toISOString()); }}>
                    <Text style={styles.quickDateButtonText}>1 Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickDateButton} onPress={() => setShowEditDatePicker(true)}>
                    <Text style={styles.quickDateButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>
                {editTaskDueDate && (
                  <View style={styles.selectedDateContainer}>
                    <Text style={styles.selectedDateText}>Due: {new Date(editTaskDueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    <TouchableOpacity onPress={() => setEditTaskDueDate(null)}><Text style={styles.clearDateButtonText}>Clear</Text></TouchableOpacity>
                  </View>
                )}
              </View>

              {showEditDatePicker && (
                <DateTimePicker value={editTaskDueDate ? new Date(editTaskDueDate) : new Date()} mode="date" display="default" onChange={(e, date) => { setShowEditDatePicker(false); if (date) setEditTaskDueDate(date.toISOString()); }} />
              )}

              {editingTask && (
                <View style={styles.editActions}>
                  <TouchableOpacity style={styles.editActionButton} onPress={() => saveAsTemplate(editingTask)}>
                    <Text style={styles.editActionText}>💾 Save as Template</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editActionButton} onPress={() => { fetchActivityLog(editingTask.id); setShowActivityModal(true); }}>
                    <Text style={styles.editActionText}>📜 View History</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCalendar(false)}><Text style={styles.modalCancel}>Close</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Calendar</Text>
            <View style={{ width: 50 }} />
          </View>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarNav}>
              <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.calendarNavButton}>◀</Text></TouchableOpacity>
              <Text style={styles.calendarMonth}>{selectedCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.calendarNavButton}>▶</Text></TouchableOpacity>
            </View>
            <View style={styles.calendarWeekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {getCalendarDays().map((item, index) => {
                const tasksForDay = item.date ? getTasksForDate(item.date) : [];
                const isToday = item.date && item.date.toDateString() === new Date().toDateString();
                return (
                  <View key={index} style={styles.calendarDay}>
                    {item.day && (
                      <>
                        <Text style={[styles.calendarDayNumber, isToday && styles.calendarDayToday]}>{item.day}</Text>
                        {tasksForDay.length > 0 && (
                          <View style={styles.calendarDots}>
                            {tasksForDay.slice(0, 3).map((task, i) => (
                              <View key={i} style={[styles.calendarDot, { backgroundColor: getAssignmentColor(task.assigned_to) }]} />
                            ))}
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Tag Modal */}
      <Modal visible={showTagModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTagModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTagModal(false)}><Text style={styles.modalCancel}>Close</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Tags</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Create New Tag</Text>
              <View style={styles.tagCreateRow}>
                <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="Tag name..." placeholderTextColor="#9CA3AF" value={newTagName} onChangeText={setNewTagName} />
                <TouchableOpacity style={[styles.addButton, { marginLeft: 8 }]} onPress={createTag}><Text style={styles.addButtonText}>+</Text></TouchableOpacity>
              </View>
              <View style={styles.colorPicker}>
                {['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map(color => (
                  <TouchableOpacity key={color} style={[styles.colorOption, { backgroundColor: color }, newTagColor === color && styles.colorOptionSelected]} onPress={() => setNewTagColor(color)} />
                ))}
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Filter by Tag</Text>
              {tags.length === 0 ? <Text style={styles.emptyTagsText}>No tags yet</Text> : (
                <View style={styles.tagList}>
                  {tags.map(tag => (
                    <View key={tag.id} style={styles.tagRow}>
                      <TouchableOpacity
                        style={[styles.tagItem, { backgroundColor: tag.color + '20', borderColor: tag.color }, filterByTag === tag.id && styles.tagItemActive]}
                        onPress={() => { setFilterByTag(filterByTag === tag.id ? null : tag.id); setShowTagModal(false); }}
                      >
                        <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                        <Text style={[styles.tagItemText, { color: tag.color }]}>{tag.name}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.tagDeleteButton} onPress={() => deleteTag(tag.id)}>
                        <Text style={styles.tagDeleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Templates Modal */}
      <Modal visible={showCreateFromTemplate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreateFromTemplate(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateFromTemplate(false)}><Text style={styles.modalCancel}>Close</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Templates</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {templates.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📋</Text>
                <Text style={styles.emptyStateText}>No templates yet</Text>
                <Text style={styles.emptyStateSubtext}>Edit a task and tap "Save as Template"</Text>
              </View>
            ) : (
              templates.map(template => (
                <View key={template.id} style={styles.templateCard}>
                  <TouchableOpacity style={styles.templateContent} onPress={() => createFromTemplate(template)}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    {(template.subtasks || []).length > 0 && <Text style={styles.templateSubtasks}>{template.subtasks.length} subtasks</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.templateDelete} onPress={() => deleteTemplate(template.id)}>
                    <Text style={styles.templateDeleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Activity Log Modal */}
      <Modal visible={showActivityModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowActivityModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowActivityModal(false)}><Text style={styles.modalCancel}>Close</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Activity History</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {activityLoading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : activityLog.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📜</Text>
                <Text style={styles.emptyStateText}>No activity recorded</Text>
                <Text style={styles.emptyStateSubtext}>Activity will appear here as you use the task</Text>
              </View>
            ) : (
              activityLog.map(activity => (
                <View key={activity.id} style={styles.activityItem}>
                  <Text style={styles.activityTime}>{formatActivityTime(activity.created_at)}</Text>
                  <Text style={styles.activityDescription}>{getActivityDescription(activity)}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Partner Modal */}
      <Modal visible={showPartnerModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPartnerModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPartnerModal(false)}><Text style={styles.modalCancel}>Close</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Partner</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {partner ? (
              <View>
                <View style={styles.partnerConnected}>
                  <Text style={styles.partnerConnectedEmoji}>👫</Text>
                  <Text style={styles.partnerConnectedText}>Connected with {partner.displayName}</Text>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Your Display Name</Text>
                  <View style={styles.tagCreateRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      placeholder="How your partner sees you"
                      placeholderTextColor="#9CA3AF"
                      value={partnerDisplayName || partner.myDisplayName}
                      onChangeText={setPartnerDisplayName}
                    />
                    <TouchableOpacity style={[styles.addButton, { marginLeft: 8 }]} onPress={updateDisplayName}>
                      <Text style={styles.addButtonText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Invite Your Partner</Text>
                  <Text style={styles.formHint}>Generate a code for your partner to join</Text>
                  {inviteCode ? (
                    <View style={styles.inviteContainer}>
                      {/* QR Code */}
                      <View style={styles.qrCodeContainer}>
                        <QRCode
                          value={`vectors://join/${inviteCode}`}
                          size={180}
                          backgroundColor="white"
                          color="#111827"
                        />
                      </View>
                      
                      {/* Code Display */}
                      <View style={styles.inviteCodeBox}>
                        <Text style={styles.inviteCodeLabel}>Or share this code:</Text>
                        <Text style={styles.inviteCode}>{inviteCode}</Text>
                      </View>
                      
                      {/* Buttons */}
                      <View style={styles.inviteButtons}>
                        <TouchableOpacity style={styles.shareButton} onPress={shareInviteCode}>
                          <Text style={styles.shareButtonText}>📤 Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.copyButton} onPress={copyInviteCode}>
                          <Text style={styles.copyButtonText}>📋 Copy Code</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.generateButton} onPress={generateInviteCode}>
                      <Text style={styles.generateButtonText}>Generate Invite Code</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.divider}><Text style={styles.dividerText}>OR</Text></View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Join Partner</Text>
                  <Text style={styles.formHint}>Enter the code your partner shared</Text>
                  <View style={styles.tagCreateRow}>
                    <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      placeholder="Enter invite code"
                      placeholderTextColor="#9CA3AF"
                      value={joinCode}
                      onChangeText={setJoinCode}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity style={[styles.addButton, { marginLeft: 8 }]} onPress={acceptInvite}>
                      <Text style={styles.addButtonText}>Join</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Board Modal */}
      <Modal visible={showBoardModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBoardModal(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBoardModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>New Board</Text>
            <TouchableOpacity onPress={createBoard} disabled={!newBoardName.trim()}>
              <Text style={[styles.modalDone, !newBoardName.trim() && styles.modalDoneDisabled]}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Board Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Shopping, Work, Home..."
                  placeholderTextColor="#9CA3AF"
                  value={newBoardName}
                  onChangeText={setNewBoardName}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Icon</Text>
                <View style={styles.iconPicker}>
                  {['📋', '🏠', '💼', '🛒', '🎯', '💡', '🔧', '📚', '🎨', '🏃', '✈️', '🎁'].map(icon => (
                    <TouchableOpacity
                      key={icon}
                      style={[styles.iconOption, newBoardIcon === icon && styles.iconOptionActive]}
                      onPress={() => setNewBoardIcon(icon)}
                    >
                      <Text style={styles.iconOptionText}>{icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Color</Text>
                <View style={styles.colorPicker}>
                  {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'].map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorOption, { backgroundColor: color }, newBoardColor === color && styles.colorOptionActive]}
                      onPress={() => setNewBoardColor(color)}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.boardPreview}>
                <View style={[styles.boardPreviewTab, { backgroundColor: newBoardColor }]}>
                  <Text style={styles.boardPreviewText}>{newBoardIcon} {newBoardName || 'Board Name'}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: 'transparent' },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogoIcon: { width: 28, height: 28, position: 'relative' },
  headerLogoArrow1: { position: 'absolute', width: 14, height: 14, borderLeftWidth: 2.5, borderBottomWidth: 2.5, borderColor: '#7C3AED', transform: [{ rotate: '45deg' }], top: 3, left: 3, borderRadius: 2 },
  headerLogoArrow2: { position: 'absolute', width: 14, height: 14, borderRightWidth: 2.5, borderTopWidth: 2.5, borderColor: '#EC4899', transform: [{ rotate: '45deg' }], bottom: 3, right: 3, borderRadius: 2 },
  headerTitle: { fontSize: 22, fontWeight: '300', letterSpacing: -0.5, color: '#111827' },
  headerButtons: { flexDirection: 'row', gap: 6 },
  headerButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  headerButtonActive: { backgroundColor: '#F3E8FF' },
  headerButtonText: { fontSize: 17 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827' },
  searchClear: { position: 'absolute', right: 28, padding: 8 },
  searchClearText: { fontSize: 16, color: '#9CA3AF' },
  filters: { flexDirection: 'row', padding: 16, paddingBottom: 8, gap: 8, backgroundColor: '#FFFFFF' },
  filterButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F9FAFB', alignItems: 'center' },
  filterButtonActive: { backgroundColor: '#111827' },
  filterButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  filterButtonTextActive: { color: '#FFFFFF' },
  statusFilters: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, backgroundColor: '#FFFFFF', gap: 8, flexWrap: 'wrap' },
  statusFilterButton: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#F3F4F6' },
  statusFilterButtonActive: { backgroundColor: '#F3E8FF' },
  statusFilterText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  statusFilterTextActive: { color: '#7C3AED', fontWeight: '600' },
  sortGroupRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', zIndex: 100 },

  // Sort By styles (dropdown)
  sortByWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'relative', zIndex: 101 },
  sortByLabel: { fontSize: 13, color: '#9CA3AF' },
  sortByDropdown: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#F3F4F6', borderRadius: 8, gap: 6 },
  sortByDropdownText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  sortByDropdownArrow: { fontSize: 10, color: '#9CA3AF' },
  sortByDropdownMenu: { position: 'absolute', top: '100%', left: 0, marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8, minWidth: 120, zIndex: 1000 },
  sortByMenuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sortByMenuItemActive: { backgroundColor: '#F3E8FF' },
  sortByMenuItemText: { fontSize: 14, color: '#374151' },
  sortByMenuItemTextActive: { color: '#7C3AED', fontWeight: '600' },
  sortByMenuItemCheck: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },

  // Legacy sort styles (keeping for compatibility)
  sortContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortLabel: { fontSize: 13, color: '#9CA3AF', marginRight: 2 },
  sortButton: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#F3F4F6' },
  sortButtonActive: { backgroundColor: '#F3E8FF' },
  sortButtonText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  sortButtonTextActive: { color: '#7C3AED', fontWeight: '600' },

  // Group By styles
  groupByWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'relative', zIndex: 100 },
  groupByLabel: { fontSize: 13, color: '#9CA3AF' },
  groupByDropdown: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#F3F4F6', borderRadius: 8, gap: 6 },
  groupByDropdownText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  groupByDropdownArrow: { fontSize: 10, color: '#9CA3AF' },
  groupByDropdownMenu: { position: 'absolute', top: '100%', right: 0, marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8, minWidth: 150, zIndex: 1000 },
  groupByMenuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  groupByMenuItemActive: { backgroundColor: '#F3E8FF' },
  groupByMenuItemText: { fontSize: 14, color: '#374151' },
  groupByMenuItemTextActive: { color: '#7C3AED', fontWeight: '600' },
  groupByMenuItemCheck: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },

  // View controls
  viewControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  viewToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 3 },
  viewToggleBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  viewToggleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  viewToggleText: { fontSize: 14, color: '#9CA3AF' },
  viewToggleTextActive: { color: '#111827' },

  // Kanban styles
  kanbanContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  kanbanContent: { paddingHorizontal: 12, paddingVertical: 12 },
  kanbanColumn: { width: 280, marginRight: 12, backgroundColor: '#FFFFFF', borderRadius: 12, maxHeight: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  kanbanColumnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  kanbanColumnTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  kanbanColumnCount: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  kanbanColumnCountText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  kanbanColumnBody: { padding: 8, maxHeight: 500 },
  kanbanCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  kanbanCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  kanbanCardCheckbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  kanbanCardCheckmark: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  kanbanCardAssignment: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kanbanCardAssignmentText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  kanbanCardTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  kanbanCardDesc: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  kanbanCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kanbanCardPriority: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  kanbanCardPriorityText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  kanbanCardDue: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  kanbanCardDueOverdue: { color: '#DC2626' },
  kanbanEmptyColumn: { padding: 20, alignItems: 'center' },
  kanbanEmptyText: { fontSize: 13, color: '#9CA3AF' },

  // Swimlane styles
  swimlaneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 8, marginBottom: 4, marginHorizontal: 12, borderRadius: 8 },
  swimlaneLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swimlaneTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  swimlaneCount: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  swimlaneCountText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  swimlaneArrow: { fontSize: 12, color: '#FFFFFF' },

  // Board selector styles
  boardSelectorContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexGrow: 0, flexShrink: 0 },
  boardSelectorContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 8, flexDirection: 'row', alignItems: 'center' },
  boardTab: { height: 34, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  boardTabActive: { backgroundColor: '#111827' },
  boardTabText: { fontSize: 13, fontWeight: '500', color: '#374151', lineHeight: 16 },
  boardTabTextActive: { color: '#FFFFFF' },
  addBoardTab: { height: 34, paddingHorizontal: 14, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#D1D5DB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addBoardTabText: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', lineHeight: 16 },

  // Board modal styles
  iconPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  iconOptionActive: { backgroundColor: '#E0E7FF', borderWidth: 2, borderColor: '#4F46E5' },
  iconOptionText: { fontSize: 20 },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption: { width: 40, height: 40, borderRadius: 20 },
  colorOptionActive: { borderWidth: 3, borderColor: '#111827' },
  boardPreview: { marginTop: 24, alignItems: 'center' },
  boardPreviewTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  boardPreviewText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  inputContainer: { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827' },
  addButton: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  detailedAddButton: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  detailedAddButtonText: { color: '#7C3AED', fontSize: 20, fontWeight: '700' },
  taskListContent: { padding: 12, paddingBottom: 100 },
  taskListContentManual: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 100 },
  swipeableContainer: { marginBottom: 12 },

  // Compact row styles (Airtable-style)
  rowContainer: { marginBottom: 0 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  taskRowCompleted: { opacity: 0.5 },
  rowCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rowCheckboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  rowCheckmark: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // Main content area
  rowContent: { flex: 1 },
  rowLine1: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#111827', flexShrink: 1 },
  rowTitleCompleted: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  rowInlineMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowAssignmentBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowAssignmentBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  rowPriorityBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  rowPriorityBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  rowDueInline: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  rowDueInlineOverdue: { color: '#DC2626', fontWeight: '600' },
  rowRecurringInline: { fontSize: 11, color: '#8B5CF6' },

  // Tag dots inline (after title)
  rowTagDotsInline: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6 },
  rowTagMini: { width: 8, height: 8, borderRadius: 4 },

  // Line 2: Description + subtasks
  rowLine2: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  rowDescriptionInline: { fontSize: 12, color: '#6B7280', flex: 1 },
  rowSubtaskCount: { fontSize: 11, color: '#10B981', fontWeight: '500' },

  // Line 3: Inline subtasks
  rowSubtasksRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' },
  miniSubtaskCompact: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  miniSubtaskBox: { width: 12, height: 12, borderRadius: 2, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  miniSubtaskBoxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  miniSubtaskTick: { color: '#FFFFFF', fontSize: 8, fontWeight: '700' },
  miniSubtaskLabel: { fontSize: 11, color: '#6B7280', maxWidth: 100 },
  miniSubtaskLabelDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  moreSubtasks: { fontSize: 10, color: '#9CA3AF' },

  // Quick actions - horizontal row on right
  rowActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 6 },
  rowActionBtn: { width: 24, height: 24, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  rowActionTxt: { fontSize: 13, color: '#9CA3AF' },

  // Legacy styles (keeping for reference)
  rowTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  rowDescription: { fontSize: 13, color: '#6B7280', marginBottom: 4, lineHeight: 18 },
  rowBottomLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  rowPriorityPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rowPriorityPillText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  rowDatePill: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#F3F4F6', borderRadius: 4 },
  rowDatePillOverdue: { backgroundColor: '#FEE2E2' },
  rowDatePillText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  rowDatePillTextOverdue: { color: '#DC2626', fontWeight: '600' },
  rowRecurringPill: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#EDE9FE', borderRadius: 4 },
  rowRecurringPillText: { fontSize: 11, color: '#7C3AED', fontWeight: '500' },
  rowTagPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  rowTagDotInline: { width: 6, height: 6, borderRadius: 3 },
  rowTagPillText: { fontSize: 11, fontWeight: '500' },
  rowSubtaskPill: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#F0FDF4', borderRadius: 4 },
  rowSubtaskText: { fontSize: 11, color: '#16A34A', fontWeight: '500' },
  rowSubtasksInline: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 2 },
  miniSubtask: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '45%' },
  miniSubtaskCheckbox: { width: 14, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  miniSubtaskChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  miniSubtaskCheckmark: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  miniSubtaskText: { fontSize: 12, color: '#4B5563', flex: 1 },
  miniSubtaskTextCompleted: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  moreSubtasksText: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },
  rowActions: { flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingLeft: 8, gap: 4 },
  rowActionButton: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  rowActionIcon: { fontSize: 14, color: '#6B7280' },

  // Legacy single-line styles (keeping for reference)
  rowTitleContainer: { flex: 1, marginRight: 8 },
  rowProgressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  rowProgressBar: { width: 40, height: 3, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  rowProgressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },
  rowProgressText: { fontSize: 10, color: '#9CA3AF' },
  rowMetadata: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTagDots: { flexDirection: 'row', gap: 3 },
  rowTagDot: { width: 8, height: 8, borderRadius: 4 },
  rowPriorityDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowPriorityText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  rowRecurringIcon: { fontSize: 12, color: '#8B5CF6' },
  rowDuePill: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#F3F4F6', borderRadius: 4 },
  rowDuePillOverdue: { backgroundColor: '#FEE2E2' },
  rowDueText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  rowDueTextOverdue: { color: '#DC2626' },
  rowAssignmentPill: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowAssignmentText: { fontSize: 10, fontWeight: '700' },

  // Draggable row styles
  taskRowDraggable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingRight: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  taskRowDragging: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    backgroundColor: '#FFFFFF',
  },
  rowDragHandle: {
    width: 28,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  rowDragHandleText: { fontSize: 14, color: '#9CA3AF', letterSpacing: -2 },

  // Legacy card styles (keeping for reference)
  taskCard: { backgroundColor: '#FFFFFF', borderRadius: 12, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, marginBottom: 12 },
  taskCardCompleted: { opacity: 0.6 },
  taskCardDragging: { shadowOpacity: 0.15, shadowRadius: 8, elevation: 8, transform: [{ scale: 1.02 }] },
  dragHandle: { width: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  dragHandleText: { fontSize: 16, color: '#9CA3AF', letterSpacing: -2 },
  accentBar: { width: 4 },
  taskContent: { flex: 1, padding: 16 },
  taskContentDraggable: { flex: 1, padding: 16 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, marginRight: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  titleContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 },
  titleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginLeft: 4 },
  titleTagBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  titleTagText: { fontSize: 11, fontWeight: '600' },
  taskTitle: { fontSize: 16, fontWeight: '500', color: '#111827', lineHeight: 24 },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#6B7280' },
  taskDescription: { fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },
  progressText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  metadata: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#F9FAFB' },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  badgeOverdue: { backgroundColor: '#FEE2E2' },
  badgeTextOverdue: { color: '#DC2626' },
  swipeDeleteButton: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 70 },
  swipeDeleteText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  swipeArchiveButton: { backgroundColor: '#6B7280', justifyContent: 'center', alignItems: 'center', width: 70 },
  swipeArchiveText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, marginTop: 8 },
  sectionHeaderText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  sectionHeaderArrow: { fontSize: 12, color: '#6B7280' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyStateEmoji: { fontSize: 64, marginBottom: 16 },
  emptyStateText: { fontSize: 16, color: '#6B7280' },
  emptyStateSubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  loadingText: { textAlign: 'center', marginTop: 48, color: '#6B7280' },
  modal: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalCancel: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  modalDone: { fontSize: 16, color: '#7C3AED', fontWeight: '600' },
  modalDoneDisabled: { opacity: 0.4 },
  modalScroll: { flex: 1 },
  modalContent: { padding: 24, paddingBottom: 48 },
  formGroup: { marginBottom: 24 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  formHint: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  formInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827' },
  formTextArea: { minHeight: 80, textAlignVertical: 'top' },
  assignmentButtons: { flexDirection: 'row', gap: 8 },
  assignmentButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  assignmentButtonText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  assignmentButtonTextActive: { color: '#FFFFFF' },
  quickDateButtons: { flexDirection: 'row', gap: 8 },
  quickDateButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  quickDateButtonText: { fontSize: 13, fontWeight: '500', color: '#111827' },
  selectedDateContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F9FAFB', borderRadius: 8 },
  selectedDateText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  clearDateButtonText: { fontSize: 14, color: '#DC2626', fontWeight: '500' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  subtaskBullet: { fontSize: 16, color: '#6B7280' },
  subtaskText: { flex: 1, fontSize: 14, color: '#111827' },
  subtaskTextCompleted: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  subtaskRemove: { fontSize: 16, color: '#9CA3AF', padding: 4 },
  subtaskChecked: { fontSize: 20, color: '#10B981' },
  subtaskUnchecked: { fontSize: 20, color: '#D1D5DB' },
  subtaskAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  subtaskAddButton: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  subtaskAddButtonText: { fontSize: 18, color: '#6B7280' },
  tagCreateRow: { flexDirection: 'row', alignItems: 'center' },
  colorPicker: { flexDirection: 'row', marginTop: 12, gap: 8 },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  colorOptionSelected: { borderWidth: 3, borderColor: '#111827' },
  tagList: { gap: 8 },
  tagRow: { flexDirection: 'row', alignItems: 'center' },
  tagItem: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1 },
  tagItemActive: { borderWidth: 2 },
  tagDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  tagItemText: { fontSize: 14, fontWeight: '500' },
  tagDeleteButton: { padding: 12, marginLeft: 8 },
  tagDeleteText: { fontSize: 16, color: '#9CA3AF' },
  tagSelectList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagSelectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1 },
  tagSelectText: { fontSize: 13, fontWeight: '500' },
  emptyTagsText: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
  editActions: { marginTop: 24, gap: 12 },
  editActionButton: { padding: 16, backgroundColor: '#F3F4F6', borderRadius: 10, alignItems: 'center' },
  editActionText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  templateCard: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  templateContent: { flex: 1, padding: 16 },
  templateName: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  templateTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  templateSubtasks: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  templateDelete: { padding: 16, justifyContent: 'center' },
  templateDeleteText: { fontSize: 18, color: '#9CA3AF' },
  activityItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  activityTime: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  activityDescription: { fontSize: 14, color: '#111827' },
  partnerConnected: { alignItems: 'center', paddingVertical: 24 },
  partnerConnectedEmoji: { fontSize: 48, marginBottom: 8 },
  partnerConnectedText: { fontSize: 16, fontWeight: '500', color: '#111827' },
  inviteContainer: { alignItems: 'center', paddingVertical: 16 },
  qrCodeContainer: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 24 },
  inviteCodeBox: { alignItems: 'center', marginBottom: 20 },
  inviteCodeLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  inviteCode: { fontSize: 28, fontWeight: '700', color: '#111827', letterSpacing: 4 },
  inviteButtons: { flexDirection: 'row', gap: 12 },
  shareButton: { paddingVertical: 14, paddingHorizontal: 24, backgroundColor: '#111827', borderRadius: 10 },
  shareButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  copyButton: { paddingVertical: 14, paddingHorizontal: 24, backgroundColor: '#F3F4F6', borderRadius: 10 },
  copyButtonText: { color: '#111827', fontWeight: '600', fontSize: 16 },
  generateButton: { paddingVertical: 16, backgroundColor: '#111827', borderRadius: 10, alignItems: 'center' },
  generateButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  divider: { alignItems: 'center', paddingVertical: 24 },
  dividerText: { fontSize: 14, color: '#9CA3AF' },
  calendarContainer: { flex: 1, padding: 16 },
  calendarNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  calendarNavButton: { fontSize: 18, color: '#7C3AED', padding: 8 },
  calendarMonth: { fontSize: 18, fontWeight: '600', color: '#111827' },
  calendarWeekHeader: { flexDirection: 'row', marginBottom: 8 },
  calendarDayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: (SCREEN_WIDTH - 32) / 7, height: 50, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  calendarDayNumber: { fontSize: 14, color: '#111827' },
  calendarDayToday: { color: '#FFFFFF', backgroundColor: '#7C3AED', borderRadius: 12, width: 24, height: 24, textAlign: 'center', lineHeight: 24, overflow: 'hidden' },
  calendarDots: { flexDirection: 'row', marginTop: 2, gap: 2 },
  calendarDot: { width: 6, height: 6, borderRadius: 3 },

  // Footer styles
  footer: { paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: 12, color: '#9CA3AF', fontWeight: '400' },
});