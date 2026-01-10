import React, { useState, useEffect } from 'react';
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
  ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';

export default function TaskListScreen() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'me', 'you', 'us'
  const [sortBy, setSortBy] = useState('created'); // 'created', 'due', 'priority'
  
  // Add task modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskAssignment, setNewTaskAssignment] = useState('me');
  const [newTaskDueDate, setNewTaskDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTaskPriority, setNewTaskPriority] = useState('none');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskRecurring, setNewTaskRecurring] = useState('none');
  
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

  useEffect(() => {
    fetchTasks();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(current => [payload.new, ...current]);
          } else if (payload.eventType === 'DELETE') {
            setTasks(current => current.filter(task => task.id !== payload.old.id));
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

  useEffect(() => {
    applyFilterAndSort();
  }, [tasks, filter, sortBy]);

  const applyFilterAndSort = () => {
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
    
    // Apply sort (overdue tasks always go to top)
    if (sortBy === 'due') {
      result.sort((a, b) => {
        // Overdue tasks first
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        // Then by due date
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
      result.sort((a, b) => {
        // Overdue tasks first
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        // Then by priority
        const aPriority = priorityOrder[a.priority || 'none'];
        const bPriority = priorityOrder[b.priority || 'none'];
        return aPriority - bPriority;
      });
    } else {
      // 'created' - newest first, but overdue at top
      result.sort((a, b) => {
        // Overdue tasks first
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        // Then by created date (newest first)
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    
    setFilteredTasks(result);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const quickAddTask = async () => {
    if (!newTask.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    // Use current filter as assignment (default to 'me' if on 'all')
    const assignment = filter === 'all' ? 'me' : filter;
    
    const { error } = await supabase
      .from('tasks')
      .insert([
        { 
          title: newTask.trim(),
          user_id: user.id,
          completed: false,
          assigned_to: assignment
        }
      ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewTask('');
    }
  };

  const addTaskWithAssignment = async () => {
    if (!newTask.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('tasks')
      .insert([
        { 
          title: newTask.trim(),
          user_id: user.id,
          completed: false,
          assigned_to: newTaskAssignment,
          due_date: newTaskDueDate,
          priority: newTaskPriority,
          description: newTaskDescription.trim() || null,
          recurring: newTaskRecurring
        }
      ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewTask('');
      setNewTaskAssignment('me');
      setNewTaskDueDate(null);
      setNewTaskPriority('none');
      setNewTaskDescription('');
      setNewTaskRecurring('none');
      setShowAddModal(false);
    }
  };

  const deleteTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      Alert.alert('Error', error.message);
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

    // If completing a recurring task with a due date, create the next one
    if (newCompletedState && task.recurring && task.recurring !== 'none' && task.due_date) {
      await createNextRecurringTask(task);
    }
  };

  const createNextRecurringTask = async (task) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Calculate next due date based on ORIGINAL due date (keeps schedule consistent)
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
        return; // No valid recurring type
    }
    
    const nextDueDate = currentDueDate.toISOString();

    const { error } = await supabase
      .from('tasks')
      .insert([{
        title: task.title,
        user_id: user.id,
        completed: false,
        assigned_to: task.assigned_to,
        due_date: nextDueDate,
        priority: task.priority,
        description: task.description,
        recurring: task.recurring,
      }]);

    if (error) {
      Alert.alert('Error creating next recurring task', error.message);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskAssignment(task.assigned_to || 'me');
    setEditTaskDueDate(task.due_date);
    setEditTaskPriority(task.priority || 'none');
    setEditTaskDescription(task.description || '');
    setEditTaskRecurring(task.recurring || 'none');
    setShowEditModal(true);
  };

  const updateTask = async () => {
    if (!editTaskTitle.trim()) return;

    const { error } = await supabase
      .from('tasks')
      .update({
        title: editTaskTitle.trim(),
        assigned_to: editTaskAssignment,
        due_date: editTaskDueDate,
        priority: editTaskPriority,
        description: editTaskDescription.trim() || null,
        recurring: editTaskRecurring,
      })
      .eq('id', editingTask.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  const getAssignmentColor = (assignment) => {
    switch (assignment) {
      case 'me': return '#7C3AED'; // Purple
      case 'you': return '#EC4899'; // Pink
      case 'us': return '#10B981'; // Green
      default: return '#9CA3AF';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#EF4444'; // Red
      case 'medium': return '#F59E0B'; // Orange
      case 'low': return '#EAB308'; // Yellow
      case 'none': return '#6B7280'; // Grey
      default: return '#6B7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      case 'none': return 'None';
      default: return 'None';
    }
  };

  const getAssignmentLabel = (assignment) => {
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

  const renderTask = ({ item }) => {
    const assignmentColor = getAssignmentColor(item.assigned_to);
    const dueDateInfo = formatDueDate(item.due_date);
    const priorityColor = getPriorityColor(item.priority || 'none');
    const priorityLabel = getPriorityLabel(item.priority || 'none');
    const recurringLabel = getRecurringLabel(item.recurring);
    
    // Check if overdue (has overdue date and not completed)
    const isOverdue = dueDateInfo?.isOverdue && !item.completed;
    const accentColor = isOverdue ? '#EF4444' : assignmentColor; // Red if overdue
    
    return (
      <View style={[styles.taskCard, item.completed && styles.taskCardCompleted]}>
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        
        <TouchableOpacity 
          style={styles.taskContent}
          onPress={() => openEditModal(item)}
          activeOpacity={0.7}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                item.completed && styles.checkboxChecked,
                { borderColor: assignmentColor }
              ]}
              onPress={(e) => {
                e.stopPropagation();
                toggleTask(item);
              }}
            >
              {item.completed && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={[
                styles.taskTitle,
                item.completed && styles.taskTitleCompleted
              ]}>
                {item.title}
              </Text>
              {item.description && (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.metadata}>
            <View style={[styles.badge, { backgroundColor: assignmentColor + '20' }]}>
              <Text style={[styles.badgeText, { color: assignmentColor }]}>
                {getAssignmentLabel(item.assigned_to)}
              </Text>
            </View>
            
            {dueDateInfo && (
              <View style={[
                styles.badge,
                dueDateInfo.isOverdue && styles.badgeOverdue
              ]}>
                <Text style={[
                  styles.badgeText,
                  dueDateInfo.isOverdue && styles.badgeTextOverdue
                ]}>
                  {dueDateInfo.text}
                </Text>
              </View>
            )}
            
            <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
              <Text style={[styles.badgeText, { color: priorityColor }]}>
                {priorityLabel}
              </Text>
            </View>
            
            {recurringLabel && (
              <View style={[styles.badge, { backgroundColor: '#8B5CF620' }]}>
                <Text style={[styles.badgeText, { color: '#8B5CF6' }]}>
                  {recurringLabel}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            deleteTask(item.id);
          }}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filters}>
        {['all', 'me', 'you', 'us'].map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.filterButtonActive,
              filter === f && { backgroundColor: f === 'all' ? '#2D7FF9' : getAssignmentColor(f) }
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === f && styles.filterButtonTextActive
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort:</Text>
        {[
          { key: 'created', label: 'Newest' },
          { key: 'due', label: 'Due Date' },
          { key: 'priority', label: 'Priority' }
        ].map(option => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.sortButton,
              sortBy === option.key && styles.sortButtonActive
            ]}
            onPress={() => setSortBy(option.key)}
          >
            <Text style={[
              styles.sortButtonText,
              sortBy === option.key && styles.sortButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
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
        />
        <TouchableOpacity style={styles.addButton} onPress={quickAddTask}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.detailedAddButton} 
          onPress={() => {
            setNewTaskAssignment(filter === 'all' ? 'me' : filter);
            setShowAddModal(true);
          }}
        >
          <Text style={styles.detailedAddButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🎯</Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all' 
                ? 'No tasks yet. Add one above!'
                : `No ${filter} tasks`
              }
            </Text>
          </View>
        }
      />

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Task</Text>
            <TouchableOpacity 
              onPress={addTaskWithAssignment}
              disabled={!newTask.trim()}
            >
              <Text style={[
                styles.modalDone,
                !newTask.trim() && styles.modalDoneDisabled
              ]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Task</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="What needs to be done?"
                  placeholderTextColor="#9CA3AF"
                  value={newTask}
                  onChangeText={setNewTask}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Add notes or details..."
                  placeholderTextColor="#9CA3AF"
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Assign To</Text>
                <View style={styles.assignmentButtons}>
                  {['me', 'you', 'us'].map(assign => (
                    <TouchableOpacity
                      key={assign}
                      style={[
                        styles.assignmentButton,
                        newTaskAssignment === assign && styles.assignmentButtonActive,
                        newTaskAssignment === assign && { 
                          backgroundColor: getAssignmentColor(assign),
                          borderColor: getAssignmentColor(assign),
                        }
                      ]}
                      onPress={() => setNewTaskAssignment(assign)}
                    >
                      <Text style={[
                        styles.assignmentButtonText,
                        newTaskAssignment === assign && styles.assignmentButtonTextActive
                      ]}>
                        {assign.charAt(0).toUpperCase() + assign.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority (Optional)</Text>
                <View style={styles.assignmentButtons}>
                  {['none', 'low', 'medium', 'high'].map(priority => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.assignmentButton,
                        newTaskPriority === priority && styles.assignmentButtonActive,
                        newTaskPriority === priority && { 
                          backgroundColor: getPriorityColor(priority),
                          borderColor: getPriorityColor(priority),
                        }
                      ]}
                      onPress={() => setNewTaskPriority(priority)}
                    >
                      <Text style={[
                        styles.assignmentButtonText,
                        newTaskPriority === priority && styles.assignmentButtonTextActive
                      ]}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Recurring (Optional)</Text>
                <View style={styles.assignmentButtons}>
                  {['none', 'daily', 'weekly', 'monthly'].map(rec => (
                    <TouchableOpacity
                      key={rec}
                      style={[
                        styles.assignmentButton,
                        newTaskRecurring === rec && styles.assignmentButtonActive,
                        newTaskRecurring === rec && { 
                          backgroundColor: '#8B5CF6',
                          borderColor: '#8B5CF6',
                        }
                      ]}
                      onPress={() => setNewTaskRecurring(rec)}
                    >
                      <Text style={[
                        styles.assignmentButtonText,
                        newTaskRecurring === rec && styles.assignmentButtonTextActive
                      ]}>
                        {rec.charAt(0).toUpperCase() + rec.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date (Optional)</Text>
                <View style={styles.quickDateButtons}>
                  <TouchableOpacity
                    style={styles.quickDateButton}
                    onPress={() => {
                      const today = new Date();
                      setNewTaskDueDate(today.toISOString());
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>Today</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.quickDateButton}
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setNewTaskDueDate(tomorrow.toISOString());
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>Tomorrow</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.quickDateButton}
                    onPress={() => {
                      const oneWeek = new Date();
                      oneWeek.setDate(oneWeek.getDate() + 7);
                      setNewTaskDueDate(oneWeek.toISOString());
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>One Week</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.quickDateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.quickDateButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>
                
                {newTaskDueDate && (
                  <TouchableOpacity 
                    style={styles.selectedDateContainer}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.selectedDateText}>
                      Due: {new Date(newTaskDueDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setNewTaskDueDate(null);
                      }}
                    >
                      <Text style={styles.clearDateButtonText}>Clear</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={newTaskDueDate ? new Date(newTaskDueDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setNewTaskDueDate(selectedDate.toISOString());
                    }
                  }}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TouchableOpacity 
              onPress={updateTask}
              disabled={!editTaskTitle.trim()}
            >
              <Text style={[
                styles.modalDone,
                !editTaskTitle.trim() && styles.modalDoneDisabled
              ]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Task</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="What needs to be done?"
                  placeholderTextColor="#9CA3AF"
                  value={editTaskTitle}
                  onChangeText={setEditTaskTitle}
                  autoFocus
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Add notes or details..."
                  placeholderTextColor="#9CA3AF"
                  value={editTaskDescription}
                  onChangeText={setEditTaskDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Assign To</Text>
                <View style={styles.assignmentButtons}>
                  {['me', 'you', 'us'].map(assign => (
                    <TouchableOpacity
                      key={assign}
                      style={[
                        styles.assignmentButton,
                        editTaskAssignment === assign && styles.assignmentButtonActive,
                        editTaskAssignment === assign && { 
                          backgroundColor: getAssignmentColor(assign),
                          borderColor: getAssignmentColor(assign),
                        }
                      ]}
                      onPress={() => setEditTaskAssignment(assign)}
                    >
                      <Text style={[
                        styles.assignmentButtonText,
                        editTaskAssignment === assign && styles.assignmentButtonTextActive
                      ]}>
                        {assign.charAt(0).toUpperCase() + assign.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority (Optional)</Text>
                <View style={styles.assignmentButtons}>
                  {['none', 'low', 'medium', 'high'].map(priority => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.assignmentButton,
                        editTaskPriority === priority && styles.assignmentButtonActive,
                        editTaskPriority === priority && { 
                          backgroundColor: getPriorityColor(priority),
                          borderColor: getPriorityColor(priority),
                        }
                      ]}
                      onPress={() => setEditTaskPriority(priority)}
                    >
                      <Text style={[
                        styles.assignmentButtonText,
                        editTaskPriority === priority && styles.assignmentButtonTextActive
                      ]}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Recurring (Optional)</Text>
                <View style={styles.assignmentButtons}>
                  {['none', 'daily', 'weekly', 'monthly'].map(rec => (
                    <TouchableOpacity
                      key={rec}
                      style={[
                        styles.assignmentButton,
                        editTaskRecurring === rec && styles.assignmentButtonActive,
                        editTaskRecurring === rec && { 
                          backgroundColor: '#8B5CF6',
                          borderColor: '#8B5CF6',
                        }
                      ]}
                      onPress={() => setEditTaskRecurring(rec)}
                    >
                      <Text style={[
                        styles.assignmentButtonText,
                        editTaskRecurring === rec && styles.assignmentButtonTextActive
                      ]}>
                        {rec.charAt(0).toUpperCase() + rec.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Due Date (Optional)</Text>
                <View style={styles.quickDateButtons}>
                  <TouchableOpacity
                    style={styles.quickDateButton}
                    onPress={() => {
                      const today = new Date();
                      setEditTaskDueDate(today.toISOString());
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>Today</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.quickDateButton}
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setEditTaskDueDate(tomorrow.toISOString());
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>Tomorrow</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.quickDateButton}
                    onPress={() => {
                      const oneWeek = new Date();
                      oneWeek.setDate(oneWeek.getDate() + 7);
                      setEditTaskDueDate(oneWeek.toISOString());
                    }}
                  >
                    <Text style={styles.quickDateButtonText}>One Week</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.quickDateButton}
                    onPress={() => setShowEditDatePicker(true)}
                  >
                    <Text style={styles.quickDateButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>
                
                {editTaskDueDate && (
                  <TouchableOpacity 
                    style={styles.selectedDateContainer}
                    onPress={() => setShowEditDatePicker(true)}
                  >
                    <Text style={styles.selectedDateText}>
                      Due: {new Date(editTaskDueDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setEditTaskDueDate(null);
                      }}
                    >
                      <Text style={styles.clearDateButtonText}>Clear</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              </View>

              {showEditDatePicker && (
                <DateTimePicker
                  value={editTaskDueDate ? new Date(editTaskDueDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEditDatePicker(false);
                    if (selectedDate) {
                      setEditTaskDueDate(selectedDate.toISOString());
                    }
                  }}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2D7FF9',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 4,
  },
  sortButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  sortButtonActive: {
    backgroundColor: '#E0E7FF',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#2D7FF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  detailedAddButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailedAddButtonText: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  accentBar: {
    width: 4,
  },
  taskContent: {
    flex: 1,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#2D7FF9',
    borderColor: '#2D7FF9',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 24,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 20,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  badgeOverdue: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextOverdue: {
    color: '#DC2626',
  },
  deleteButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 28,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 48,
    color: '#6B7280',
  },
  
  // Modal styles
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
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalDone: {
    fontSize: 16,
    color: '#2D7FF9',
    fontWeight: '600',
  },
  modalDoneDisabled: {
    opacity: 0.4,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 24,
    paddingBottom: 48,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  assignmentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  assignmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  assignmentButtonActive: {
    backgroundColor: '#2D7FF9',
    borderColor: '#2D7FF9',
  },
  assignmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  assignmentButtonTextActive: {
    color: '#FFFFFF',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickDateButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  selectedDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  selectedDateText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  clearDateButton: {
    marginTop: 8,
    padding: 8,
    alignItems: 'center',
  },
  clearDateButtonText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
});