# Boards, Swimlanes & Kanban Implementation Plan

## Overview
Add Trello/Airtable-style boards with swimlane grouping and optional Kanban view.

## Features Summary
1. **Boards** - Flexible user-defined boards (projects, areas, etc.)
2. **Status Field** - To Do, In Progress, Done + custom statuses
3. **Swimlanes** - Vertical grouped sections with "Group by" dropdown
4. **Kanban Toggle** - Horizontal column layout (same data, different display)
5. **Board Sharing** - Private + shared boards with partner

---

## Database Changes (Supabase)

### New Tables

```sql
-- 1. Boards table
CREATE TABLE boards (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '📋',
  sort_order INTEGER DEFAULT 0
);

-- 2. Custom statuses per board
CREATE TABLE board_statuses (
  id BIGSERIAL PRIMARY KEY,
  board_id BIGINT REFERENCES boards ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  sort_order INTEGER DEFAULT 0
);

-- Insert default statuses when board created (via trigger or app logic)
-- Default: To Do, In Progress, Done
```

### Modify Tasks Table

```sql
-- Add board reference and status
ALTER TABLE tasks ADD COLUMN board_id BIGINT REFERENCES boards;
ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'todo';
-- Values: 'todo', 'in_progress', 'done' (or FK to board_statuses for custom)
```

### RLS Policies

```sql
-- Boards: Owner can do anything
CREATE POLICY "Users can manage own boards" ON boards
  FOR ALL USING (auth.uid() = user_id);

-- Shared boards: Partner can view/edit if is_shared=true
CREATE POLICY "Partners can access shared boards" ON boards
  FOR ALL USING (
    is_shared = true AND EXISTS (
      SELECT 1 FROM partnerships
      WHERE (user1_id = auth.uid() AND user2_id = boards.user_id)
         OR (user2_id = auth.uid() AND user1_id = boards.user_id)
    )
  );
```

---

## UI Implementation

### Phase 1: Add Status Field to Tasks

**File:** `TaskListScreen.js`

1. Add status to task creation:
```javascript
// In quickAddTask and addTaskWithAssignment
{ ...taskData, status: 'todo' }
```

2. Add status to edit modal:
```javascript
const [editTaskStatus, setEditTaskStatus] = useState('todo');
// Status picker buttons: To Do | In Progress | Done
```

3. Add status display in task rows (optional pill in metadata)

### Phase 2: Group By Dropdown

**New State:**
```javascript
const [groupBy, setGroupBy] = useState('none'); // 'none'|'assignee'|'priority'|'dueDate'|'status'|'board'
const [collapsedGroups, setCollapsedGroups] = useState({});
```

**New Grouping Functions:**
```javascript
const groupTasksByField = (tasks, field) => {
  const groups = {};
  tasks.forEach(task => {
    const key = getGroupKey(task, field);
    if (!groups[key]) groups[key] = { title: getGroupTitle(key, field), tasks: [] };
    groups[key].tasks.push(task);
  });
  return groups;
};

const getGroupKey = (task, field) => {
  switch(field) {
    case 'assignee': return task.assigned_to || 'unassigned';
    case 'priority': return task.priority || 'none';
    case 'status': return task.status || 'todo';
    case 'dueDate': return getDueDateGroup(task.due_date); // 'overdue'|'today'|'week'|'later'|'none'
    case 'board': return task.board_id || 'inbox';
    default: return 'all';
  }
};
```

**Modify applyFilterAndSort():**
```javascript
// After filtering, before building displayList:
if (groupBy !== 'none') {
  const groups = groupTasksByField(incompleteTasks, groupBy);
  Object.entries(groups).forEach(([key, group]) => {
    displayList.push({ type: 'swimlane', title: group.title, groupKey: key, count: group.tasks.length });
    if (!collapsedGroups[key]) {
      group.tasks.forEach(task => displayList.push({ type: 'task', data: task }));
    }
  });
} else {
  // Current behavior
}
```

**UI: Group By Dropdown:**
```javascript
// Add after sort buttons
<View style={styles.groupByContainer}>
  <Text style={styles.groupByLabel}>Group:</Text>
  <TouchableOpacity style={styles.groupByDropdown} onPress={() => setShowGroupByPicker(true)}>
    <Text>{groupByLabels[groupBy]}</Text>
    <Text>▼</Text>
  </TouchableOpacity>
</View>
```

### Phase 3: Swimlane Headers

**New renderItem case:**
```javascript
if (item.type === 'swimlane') {
  const isCollapsed = collapsedGroups[item.groupKey];
  return (
    <TouchableOpacity
      style={[styles.swimlaneHeader, { backgroundColor: getGroupColor(item.groupKey) }]}
      onPress={() => toggleGroupCollapse(item.groupKey)}
    >
      <View style={styles.swimlaneLeft}>
        <Text style={styles.swimlaneTitle}>{item.title}</Text>
        <View style={styles.swimlaneCount}>
          <Text style={styles.swimlaneCountText}>{item.count}</Text>
        </View>
      </View>
      <Text style={styles.swimlaneArrow}>{isCollapsed ? '▶' : '▼'}</Text>
    </TouchableOpacity>
  );
}
```

### Phase 4: Kanban View Toggle

**New State:**
```javascript
const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
```

**Kanban Rendering:**
```javascript
{viewMode === 'kanban' ? (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kanbanContainer}>
    {Object.entries(groupTasksByField(incompleteTasks, groupBy || 'status')).map(([key, group]) => (
      <View key={key} style={styles.kanbanColumn}>
        <View style={[styles.kanbanColumnHeader, { backgroundColor: getGroupColor(key) }]}>
          <Text style={styles.kanbanColumnTitle}>{group.title}</Text>
          <Text style={styles.kanbanColumnCount}>{group.tasks.length}</Text>
        </View>
        <ScrollView style={styles.kanbanColumnBody}>
          {group.tasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={styles.kanbanCard}
              onPress={() => openEditModal(task)}
            >
              <Text style={styles.kanbanCardTitle} numberOfLines={2}>{task.title}</Text>
              {/* Mini metadata */}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    ))}
  </ScrollView>
) : (
  // Existing FlatList/DraggableFlatList
)}
```

### Phase 5: Boards System

**New State:**
```javascript
const [boards, setBoards] = useState([]);
const [currentBoard, setCurrentBoard] = useState(null); // null = inbox/all
```

**Board Selector UI (top of screen):**
```javascript
<View style={styles.boardSelector}>
  <TouchableOpacity
    style={[styles.boardTab, !currentBoard && styles.boardTabActive]}
    onPress={() => setCurrentBoard(null)}
  >
    <Text>Inbox</Text>
  </TouchableOpacity>
  {boards.map(board => (
    <TouchableOpacity
      key={board.id}
      style={[styles.boardTab, currentBoard?.id === board.id && styles.boardTabActive]}
      onPress={() => setCurrentBoard(board)}
    >
      <Text>{board.icon} {board.name}</Text>
    </TouchableOpacity>
  ))}
  <TouchableOpacity style={styles.addBoardButton} onPress={() => setShowAddBoardModal(true)}>
    <Text>+</Text>
  </TouchableOpacity>
</View>
```

**Filter by Board:**
```javascript
// In applyFilterAndSort, after search filter:
if (currentBoard) {
  result = result.filter(task => task.board_id === currentBoard.id);
}
```

---

## New Styles

```javascript
// Swimlane styles
swimlaneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, marginTop: 8, borderRadius: 8 },
swimlaneTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
swimlaneCount: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
swimlaneCountText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
swimlaneArrow: { fontSize: 12, color: '#FFFFFF' },

// Kanban styles
kanbanContainer: { flex: 1, paddingHorizontal: 12 },
kanbanColumn: { width: 280, marginRight: 12, backgroundColor: '#F3F4F6', borderRadius: 8, maxHeight: '100%' },
kanbanColumnHeader: { padding: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8, flexDirection: 'row', justifyContent: 'space-between' },
kanbanColumnTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
kanbanColumnCount: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
kanbanColumnBody: { padding: 8, flex: 1 },
kanbanCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 6, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
kanbanCardTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },

// Board selector styles
boardSelector: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8, backgroundColor: '#F9FAFB' },
boardTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#FFFFFF' },
boardTabActive: { backgroundColor: '#2D7FF9' },

// Group by dropdown
groupByContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
groupByLabel: { fontSize: 13, color: '#6B7280', marginRight: 4 },
groupByDropdown: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F9FAFB', borderRadius: 6 },
```

---

## Implementation Order

### Sprint 1: Foundation
1. Run SQL migrations for boards and board_statuses tables
2. Add status field to tasks table
3. Add status picker to task edit modal
4. Test status updates work

### Sprint 2: Grouping
1. Add groupBy state and dropdown UI
2. Implement groupTasksByField() function
3. Modify applyFilterAndSort() for grouping
4. Add swimlane header rendering
5. Add collapse/expand functionality

### Sprint 3: Kanban
1. Add viewMode state and toggle button
2. Implement kanban column layout
3. Add kanban card component
4. Style and polish

### Sprint 4: Boards
1. Fetch boards from Supabase
2. Add board selector UI
3. Add board_id to task creation
4. Filter tasks by current board
5. Add board creation modal
6. Add board sharing toggle

---

## Files to Modify

| File | Changes |
|------|---------|
| `screens/TaskListScreen.js` | Status field, groupBy, swimlanes, kanban, boards |
| `lib/supabase.js` | No changes needed |

## Files to Create (Optional)

| File | Purpose |
|------|---------|
| `components/SwimLaneHeader.js` | Extract swimlane header (optional) |
| `components/KanbanColumn.js` | Extract kanban column (optional) |
| `components/BoardSelector.js` | Extract board tabs (optional) |

---

## Verification Steps

1. **Status Field:**
   - Create task, verify status='todo' in Supabase
   - Edit task, change status, verify persists
   - Status shows in task row metadata

2. **Grouping:**
   - Select "Group by: Assignee" → tasks grouped into Me/You/Us sections
   - Select "Group by: Priority" → tasks grouped into High/Medium/Low/None
   - Collapse a group → tasks hidden, header shows count
   - Expand → tasks visible again

3. **Kanban:**
   - Toggle to Kanban view → horizontal scrollable columns
   - Columns match current groupBy setting
   - Tap card → opens edit modal
   - Toggle back to list → normal list view

4. **Boards:**
   - Create board "Shopping" → appears in board tabs
   - Create task while on Shopping board → task.board_id set
   - Switch to Inbox → see all tasks
   - Switch to Shopping → only Shopping tasks visible
   - Share board with partner → partner can see/edit
