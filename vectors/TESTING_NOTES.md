# Vectors App - Testing Notes
Last Updated: 2026-01-11

## All Features Complete

### 1. Drag-and-Drop Reordering
- "Manual" sort option enables drag-and-drop
- Long-press or use drag handle to reorder
- Persists to `sort_order` column

### 2. Status Field
- Tasks have status: To Do | In Progress | Done
- Status picker in Add/Edit task modals

### 3. Swimlane Grouping
- "Group By" dropdown (proper dropdown menu, not buttons)
- Group by: None | Assignee | Priority | Status | Due Date
- Color-coded collapsible swimlane headers

### 4. Boards System
- Board tabs below search bar
- "Inbox" shows all tasks
- Create custom boards with icon + color
- Long-press board tab to delete

### 5. Kanban View (NEW)
- View toggle buttons: ☰ (List) | ▦ (Kanban)
- Horizontal scrolling columns
- Cards show: checkbox, title, description, priority, due date
- Tap card to edit task
- Tap checkbox to complete task
- Auto-groups by Status if no grouping selected

---

## Database Migrations Required

Run this SQL in Supabase:

```sql
-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '📋',
  sort_order INTEGER DEFAULT 0
);

-- Add columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS board_id BIGINT REFERENCES boards;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- RLS for boards
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own boards" ON boards FOR ALL USING (auth.uid() = user_id);
```

---

## How to Test

1. Run the SQL migrations
2. Refresh browser at http://localhost:8083

**Test Group By Dropdown:**
- Click "Group:" dropdown
- Should show dropdown menu below button (not buttons across screen)
- Select an option, dropdown closes

**Test Kanban View:**
- Click the ▦ button (next to ☰)
- See horizontal scrolling columns
- Each column is a group (Status by default)
- Cards show task details
- Tap card to edit
- Scroll horizontally to see all columns

**Test Boards:**
- See "Inbox" tab at top
- Click "+ Board" to create new board
- Switch between boards
- Long-press to delete

---

## Status: ALL SPRINTS COMPLETE
- Sprint 1: Status field ✓
- Sprint 2: Swimlanes ✓
- Sprint 3: Kanban ✓
- Sprint 4: Boards ✓
