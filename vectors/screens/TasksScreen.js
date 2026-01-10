/**
 * TasksScreen
 *
 * Main screen showing the task list with filters, quick-add, and task cards.
 * Supports drag-and-drop reordering when in "Manual" sort mode.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  ShadowDecorator,
} from 'react-native-draggable-flatlist';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { supabase } from '../lib/supabase';
import theme, { getAssignmentColor, getPriorityColor } from '../theme';
import useHaptics from '../hooks/useHaptics';

// Components
import { TaskCard, FilterBar, QuickAddBar, EmptyState } from '../components';

export default function TasksScreen({ navigation }) {
  const haptics = useHaptics();
  const bottomSheetRef = useRef(null);

  // Task state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');

  // Manual order state (task IDs in order)
  const [manualOrder, setManualOrder] = useState([]);

  // Add/Edit task state
  const [editingTask, setEditingTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignment, setTaskAssignment] = useState('me');
  const [taskPriority, setTaskPriority] = useState('none');
  const [taskDueDate, setTaskDueDate] = useState(null);
  const [taskRecurring, setTaskRecurring] = useState('none');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['75%'], []);

  // Is manual sort mode active?
  const isManualMode = sortBy === 'manual';

  // Set up navigation header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleSignOut}
          style={styles.headerButton}
          hitSlop={8}
        >
          <Text style={styles.headerButtonText}>Sign Out</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  // Fetch tasks and subscribe to changes
  useEffect(() => {
    fetchTasks();

    const subscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(current => [payload.new, ...current]);
            // Add new task to beginning of manual order
            setManualOrder(current => [payload.new.id, ...current]);
          } else if (payload.eventType === 'DELETE') {
            setTasks(current => current.filter(task => task.id !== payload.old.id));
            setManualOrder(current => current.filter(id => id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(current =>
              current.map(task => task.id === payload.new.id ? payload.new : task)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply filter
    if (filter !== 'all') {
      result = result.filter(task => task.assigned_to === filter);
    }

    // Helper to check if task is overdue
    const isOverdue = (task) => {
      if (!task.due_date || task.completed) return false;
      return new Date(task.due_date) < new Date();
    };

    // Apply sort
    if (sortBy === 'manual') {
      // Use manual order - tasks not in order go to the end
      const orderMap = new Map(manualOrder.map((id, index) => [id, index]));
      result.sort((a, b) => {
        const aIndex = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
        const bIndex = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
        return aIndex - bIndex;
      });
    } else if (sortBy === 'due') {
      result.sort((a, b) => {
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
      const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
      result.sort((a, b) => {
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        const aPriority = priorityOrder[a.priority || 'none'];
        const bPriority = priorityOrder[b.priority || 'none'];
        return aPriority - bPriority;
      });
    } else {
      // 'created' - newest first, but overdue at top
      result.sort((a, b) => {
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    return result;
  }, [tasks, filter, sortBy, manualOrder]);

  // Handlers
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTasks(data || []);
      // Initialize manual order from tasks with position, or use default order
      const ordered = (data || [])
        .sort((a, b) => {
          if (a.position != null && b.position != null) {
            return a.position - b.position;
          }
          if (a.position != null) return -1;
          if (b.position != null) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        })
        .map(t => t.id);
      setManualOrder(ordered);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleQuickAdd = async (title) => {
    const { data: { user } } = await supabase.auth.getUser();
    const assignment = filter === 'all' ? 'me' : filter;

    // Get the lowest position to put new task at top
    const minPosition = tasks.reduce((min, t) => {
      if (t.position != null && t.position < min) return t.position;
      return min;
    }, 0);

    const { error } = await supabase
      .from('tasks')
      .insert([{
        title,
        user_id: user.id,
        completed: false,
        assigned_to: assignment,
        position: minPosition - 1,
      }]);

    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleOpenTaskSheet = (prefillTitle = '') => {
    setEditingTask(null);
    setTaskTitle(prefillTitle);
    setTaskDescription('');
    setTaskAssignment(filter === 'all' ? 'me' : filter);
    setTaskPriority('none');
    setTaskDueDate(null);
    setTaskRecurring('none');
    bottomSheetRef.current?.expand();
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskAssignment(task.assigned_to || 'me');
    setTaskPriority(task.priority || 'none');
    setTaskDueDate(task.due_date);
    setTaskRecurring(task.recurring || 'none');
    bottomSheetRef.current?.expand();
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    const taskData = {
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      assigned_to: taskAssignment,
      priority: taskPriority,
      due_date: taskDueDate,
      recurring: taskRecurring,
    };

    if (editingTask) {
      // Update existing task
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    } else {
      // Create new task
      const minPosition = tasks.reduce((min, t) => {
        if (t.position != null && t.position < min) return t.position;
        return min;
      }, 0);

      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          user_id: user.id,
          completed: false,
          position: minPosition - 1,
        }]);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
    }

    haptics.success();
    bottomSheetRef.current?.close();
    resetTaskForm();
  };

  const handleToggleTask = async (task) => {
    const newCompletedState = !task.completed;

    const { error } = await supabase
      .from('tasks')
      .update({ completed: newCompletedState })
      .eq('id', task.id);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    // If completing a recurring task with a due date, create the next one
    if (newCompletedState && task.recurring && task.recurring !== 'none' && task.due_date) {
      await createNextRecurringTask(task);
    }
  };

  const createNextRecurringTask = async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    const currentDueDate = new Date(task.due_date);

    switch (task.recurring) {
      case 'daily':
        currentDueDate.setDate(currentDueDate.getDate() + 1);
        break;
      case 'weekly':
        currentDueDate.setDate(currentDueDate.getDate() + 7);
        break;
      case 'monthly':
        currentDueDate.setMonth(currentDueDate.getMonth() + 1);
        break;
      default:
        return;
    }

    const { error } = await supabase
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
        position: task.position,
      }]);

    if (error) {
      Alert.alert('Error creating recurring task', error.message);
    }
  };

  const handleDeleteTask = async (task) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);

    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Handle drag end - update order locally and persist to database
  const handleDragEnd = async ({ data: reorderedData }) => {
    haptics.medium();

    // Update local state immediately for responsiveness
    const newOrder = reorderedData.map(task => task.id);
    setManualOrder(newOrder);

    // Persist positions to database
    const updates = reorderedData.map((task, index) => ({
      id: task.id,
      position: index,
    }));

    // Update each task's position
    for (const update of updates) {
      const { error } = await supabase
        .from('tasks')
        .update({ position: update.position })
        .eq('id', update.id);

      if (error) {
        console.error('Error updating position:', error);
      }
    }
  };

  const resetTaskForm = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskAssignment('me');
    setTaskPriority('none');
    setTaskDueDate(null);
    setTaskRecurring('none');
  };

  // Render bottom sheet backdrop
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Render task item for regular FlatList
  const renderTask = useCallback(({ item }) => (
    <TaskCard
      task={item}
      onToggle={handleToggleTask}
      onPress={handleEditTask}
      onDelete={handleDeleteTask}
      isDraggable={false}
    />
  ), []);

  // Render task item for DraggableFlatList
  const renderDraggableTask = useCallback(({ item, drag, isActive }) => (
    <ScaleDecorator>
      <TaskCard
        task={item}
        onToggle={handleToggleTask}
        onPress={handleEditTask}
        onDelete={handleDeleteTask}
        drag={drag}
        isActive={isActive}
        isDraggable={true}
      />
    </ScaleDecorator>
  ), []);

  // Get empty state message based on filter
  const getEmptyStateMessage = () => {
    if (filter === 'all') {
      return { title: 'No tasks yet', message: 'Add your first task above', icon: '✓' };
    }
    return {
      title: `No ${filter} tasks`,
      message: `Tasks assigned to "${filter}" will appear here`,
      icon: filter === 'us' ? '👥' : '📋',
    };
  };

  const emptyState = getEmptyStateMessage();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Manual mode hint */}
      {isManualMode && filteredTasks.length > 0 && (
        <View style={styles.manualModeHint}>
          <Text style={styles.manualModeHintText}>
            Long press and drag to reorder tasks
          </Text>
        </View>
      )}

      {/* Quick Add */}
      <QuickAddBar
        onQuickAdd={handleQuickAdd}
        onOpenDetails={handleOpenTaskSheet}
        placeholder={`Add ${filter === 'all' ? 'a' : `a "${filter}"`} task...`}
      />

      {/* Task List */}
      {isManualMode ? (
        <DraggableFlatList
          data={filteredTasks}
          renderItem={renderDraggableTask}
          keyExtractor={item => item.id.toString()}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title={emptyState.title}
              message={emptyState.message}
              icon={emptyState.icon}
            />
          }
          activationDistance={10}
        />
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              title={emptyState.title}
              message={emptyState.message}
              icon={emptyState.icon}
            />
          }
        />
      )}

      {/* Task Detail Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        onClose={resetTaskForm}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {editingTask ? 'Edit Task' : 'New Task'}
                </Text>
                <TouchableOpacity
                  onPress={handleSaveTask}
                  disabled={!taskTitle.trim()}
                >
                  <Text style={[
                    styles.sheetSaveButton,
                    !taskTitle.trim() && styles.sheetSaveButtonDisabled
                  ]}>
                    {editingTask ? 'Save' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Task Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Task</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="What needs to be done?"
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  autoFocus={!editingTask}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Add notes or details..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Assignment */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Assign To</Text>
                <View style={styles.optionRow}>
                  {['me', 'you', 'us'].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        taskAssignment === option && {
                          backgroundColor: getAssignmentColor(option),
                          borderColor: getAssignmentColor(option),
                        }
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setTaskAssignment(option);
                      }}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        taskAssignment === option && styles.optionButtonTextSelected
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.optionRow}>
                  {['none', 'low', 'medium', 'high'].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        taskPriority === option && {
                          backgroundColor: getPriorityColor(option),
                          borderColor: getPriorityColor(option),
                        }
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setTaskPriority(option);
                      }}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        taskPriority === option && styles.optionButtonTextSelected
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Recurring */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Recurring</Text>
                <View style={styles.optionRow}>
                  {['none', 'daily', 'weekly', 'monthly'].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionButton,
                        taskRecurring === option && {
                          backgroundColor: theme.colors.primary[500],
                          borderColor: theme.colors.primary[500],
                        }
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setTaskRecurring(option);
                      }}
                    >
                      <Text style={[
                        styles.optionButtonText,
                        taskRecurring === option && styles.optionButtonTextSelected
                      ]}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Due Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date</Text>
                <View style={styles.optionRow}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      const today = new Date();
                      setTaskDueDate(today.toISOString());
                      haptics.selection();
                    }}
                  >
                    <Text style={styles.dateButtonText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setTaskDueDate(tomorrow.toISOString());
                      haptics.selection();
                    }}
                  >
                    <Text style={styles.dateButtonText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setTaskDueDate(nextWeek.toISOString());
                      haptics.selection();
                    }}
                  >
                    <Text style={styles.dateButtonText}>Next Week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>

                {taskDueDate && (
                  <View style={styles.selectedDateRow}>
                    <Text style={styles.selectedDateText}>
                      Due: {new Date(taskDueDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    <TouchableOpacity onPress={() => setTaskDueDate(null)}>
                      <Text style={styles.clearDateText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {showDatePicker && (
                  <DateTimePicker
                    value={taskDueDate ? new Date(taskDueDate) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setTaskDueDate(selectedDate.toISOString());
                      }
                    }}
                  />
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },
  headerButton: {
    paddingHorizontal: theme.spacing[2],
  },
  headerButtonText: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[500],
  },
  manualModeHint: {
    backgroundColor: theme.colors.primary[50],
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary[100],
  },
  manualModeHintText: {
    ...theme.typography.styles.caption,
    color: theme.colors.primary[700],
    textAlign: 'center',
  },
  listContent: {
    padding: theme.spacing[4],
    flexGrow: 1,
  },

  // Bottom Sheet
  bottomSheetBackground: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius['2xl'],
  },
  bottomSheetHandle: {
    backgroundColor: theme.colors.neutral[300],
    width: 40,
  },
  bottomSheetContent: {
    flex: 1,
    padding: theme.spacing[6],
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  sheetTitle: {
    ...theme.typography.styles.h3,
  },
  sheetSaveButton: {
    ...theme.typography.styles.body,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sheetSaveButtonDisabled: {
    opacity: 0.4,
  },

  // Form
  formGroup: {
    marginBottom: theme.spacing[5],
  },
  formLabel: {
    ...theme.typography.styles.label,
    marginBottom: theme.spacing[2],
  },
  formInput: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  optionButton: {
    flex: 1,
    paddingVertical: theme.spacing[2.5],
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  optionButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  dateButton: {
    flex: 1,
    paddingVertical: theme.spacing[2.5],
    paddingHorizontal: theme.spacing[1],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  selectedDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing[3],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
  },
  selectedDateText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  clearDateText: {
    ...theme.typography.styles.body,
    color: theme.colors.semantic.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
