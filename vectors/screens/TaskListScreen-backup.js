import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function TaskListScreen() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'me', 'you', 'us'
  
  // Add task modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskAssignment, setNewTaskAssignment] = useState('me');

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
    applyFilter();
  }, [tasks, filter]);

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.assigned_to === filter));
    }
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
    
    const { error } = await supabase
      .from('tasks')
      .insert([
        { 
          title: newTask.trim(),
          user_id: user.id,
          completed: false,
          assigned_to: 'me'
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
          assigned_to: newTaskAssignment
        }
      ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewTask('');
      setNewTaskAssignment('me');
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
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);

    if (error) {
      Alert.alert('Error', error.message);
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

  const getAssignmentLabel = (assignment) => {
    switch (assignment) {
      case 'me': return 'Me';
      case 'you': return 'You';
      case 'us': return 'Us';
      default: return 'Unassigned';
    }
  };

  const renderTask = ({ item }) => {
    const assignmentColor = getAssignmentColor(item.assigned_to);
    
    return (
      <TouchableOpacity 
        style={[styles.taskCard, item.completed && styles.taskCardCompleted]}
        onPress={() => toggleTask(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.accentBar, { backgroundColor: assignmentColor }]} />
        
        <View style={styles.taskContent}>
          <View style={styles.topRow}>
            <View style={[
              styles.checkbox,
              item.completed && styles.checkboxChecked,
              { borderColor: assignmentColor }
            ]}>
              {item.completed && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            
            <Text style={[
              styles.taskTitle,
              item.completed && styles.taskTitleCompleted
            ]}>
              {item.title}
            </Text>
          </View>
          
          <View style={styles.metadata}>
            <View style={[styles.badge, { backgroundColor: assignmentColor + '20' }]}>
              <Text style={[styles.badgeText, { color: assignmentColor }]}>
                {getAssignmentLabel(item.assigned_to)}
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            deleteTask(item.id);
          }}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
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
          onPress={() => setShowAddModal(true)}
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
          </View>
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
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 24,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
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
    textTransform: 'capitalize',
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
  modalContent: {
    padding: 24,
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
});