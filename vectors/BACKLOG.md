# Vectors Backlog
*Living document for ideas, bugs, and project tracking for the Vectors couples task manager app*

---

## Quick Navigation
- [New Ideas](#new-ideas)
- [Questions to Discuss](#questions-to-discuss)
- [Bugs](#bugs)
- [Low Priority / Nice to Have](#low-priority--nice-to-have)
- [In Production](#in-production)
- [Archived](#archived)
- [Claude Code Cheat Sheet](#claude-code-cheat-sheet)

---

## New Ideas

> Add new feature ideas, enhancements, and "what if" thoughts here

for both web and mobile app:
- "tags" (e.g., "kids") is showing up on cards as a colored dot in different places (if there is a task description, it's to the right of the end of the description; if no task description, it's under the task name). on the web app, i want this to show as the full tag (as a tag looks like in the edit task module) and not just a dot. in the mobile app, a colored dot only is fine but it needs to show up in the same place consistently - let's have it sit at at the end of the task name (for example, if task name was "grocery shopping" and had a green "shopping" tag, the green dot should show up one character space after the word "shopping" in the name).

for mobile app:
- when sorting by "manual", the spacing between cards is off. they should show up directly after another but there is blank space between each.
- put a tiny bit more white space between the search bar at the top and the header area. make the space between header and search bar the same distance as the space between the search bar and the inbox/home/+board buttons.

### UI/UX Enhancements
- [ ] Swipe gestures: swipe right to complete, swipe left to assign to partner
- [ ] Task templates: "Grocery run" pre-populates common items
- [ ] Weekly review mode: guided walkthrough of incomplete tasks
- [ ] Task streaks: gamification for recurring tasks ("10 days of making bed!")
- [ ] Photo attachments on tasks
- [ ] Confetti animation on task completion
- [ ] Sound effects toggle for completion/actions
- [ ] Dark mode support

### Input Methods
- [ ] Voice input for quick task creation
- [ ] Siri/Google Assistant integration for voice commands outside app
- [ ] Share extension: add tasks from other apps

### Notifications & Reminders
- [ ] Push notifications for due dates and partner activity
- [ ] Location-based reminders (geo-fenced task triggers)
- [ ] Partner completion alerts (when partner finishes a task)
- [ ] Smart reminder timing based on task patterns

### Organization Features
- [ ] Custom status workflows per board (beyond To Do/In Progress/Done)
- [ ] Tags with custom colors
- [ ] Activity timeline view (who did what and when)
- [ ] Task dependencies (can't start B until A is done)
- [ ] Subtask progress bar on parent task

### Platform Expansion
- [ ] Apple Watch complication for quick-add
- [ ] iPad-optimized layouts
- [ ] Web dashboard for desktop access
- [ ] Widget stacking for iOS home screen
- [ ] Share task completion to partner via iMessage

### Data & Sync
- [ ] Offline mode with local-first storage
- [ ] **Import from Trello** (HIGH PRIORITY - scoped Jan 2026)
  - OAuth flow for seamless Trello connection
  - Full migration: cards, lists, labels, due dates, checklists, assignments
  - 1 Trello board → 1 Vectors board mapping
  - Labels → tags with matching colors + infer priority from label names
  - Checklists → subtasks
  - UI in both onboarding flow AND settings screen
- [ ] Export tasks to JSON/CSV

---

## Questions to Discuss

> Things to think through before implementing

1. **Assignment model clarity:** Should "Us" mean "either of us can complete" or "we do it together"? Currently ambiguous in the UI.

2. **Notification philosophy:** How aggressive should reminders be? Partner completion alerts on by default?

3. **Offline behavior:** What works offline? What shows "waiting to sync"? How to handle conflicts?

4. **Recurring task UX:** When completing a recurring task, should it auto-generate the next instance immediately or at the scheduled time?

5. **Board deletion behavior:** Currently moves tasks to Inbox. Should it ask to delete tasks too, or always preserve?

6. **Kanban drag-drop:** Should dragging a card between columns change its status? (e.g., drag to "Done" column = mark complete)

7. **Partner invitation flow:** Currently uses invite codes. Should we add email-based invitations?

8. **explore auth/login revamp - no email login, magic link only? what are the options here. email login is another password to save and can be clunky.

9. **review branded app icons.

---

## Bugs

> Known issues to fix

- [ ] *No bugs tracked yet - add as discovered*

### Known Limitations (Not Bugs)
- UI polish still needed in some areas
- No voice input yet
- Basic notifications only (no push)
- No location-based reminders

---

## Low Priority / Nice to Have

> Good ideas that aren't urgent - revisit later

### Polish & Delight
- [ ] Confetti animation on completing all tasks for the day
- [ ] Sound effects toggle (satisfying completion sounds)
- [ ] Accessibility audit (VoiceOver, Dynamic Type)
- [ ] Custom app icons (different colors/styles)
- [ ] Family member avatars/photos on assignments

### Platform Extensions
- [ ] Apple Watch app with complication
- [ ] Siri Shortcuts integration
- [ ] iPad split-view layout
- [ ] Web version for desktop access
- [ ] Home screen widgets (iOS/Android)
- [ ] iMessage app for quick task sharing

### Advanced Features
- [ ] Task templates library (community shared)
- [ ] Recurring task analytics (completion rate over time)
- [ ] Smart suggestions ("You usually add milk on Thursdays")
- [ ] Calendar integration (show tasks on calendar view)

---

## In Production

> What's currently deployed and usable

### Vectors v1.0 (TestFlight)
**Version:** 1.0.0+
**Status:** TestFlight builds available
**Users:** Wally (testing), Courtney (pending onboarding)

### Working Features

**Core Task Management:**
- Task creation via quick-add bar or detailed modal
- Task editing with full property support
- Task completion with haptic feedback
- Task archiving
- Real-time sync between devices
- Email/password authentication
- Partnership system (invite codes)

**Task Properties:**
- Title and description
- Due dates with date picker
- Priority levels (High, Medium, Low, None)
- Assignment (Me, You, Us)
- Status (To Do, In Progress, Done)
- Recurring options (Daily, Weekly, Monthly)
- Board association
- Manual sort order

**Organization:**
- Boards system with custom icons and colors
- Swimlane grouping (by Assignee, Priority, Status, Due Date)
- Collapsible groups
- Kanban view toggle
- Multiple sort options (Manual, Newest, Due Date, Priority)
- Search (title and description)
- Filter by assignment

**UX Polish:**
- Haptic feedback throughout
- Spring animations on interactions
- Drag-and-drop reordering (manual sort)
- Color-coded assignments and priorities
- Overdue task highlighting
- Empty state animations

### Current Milestone: Wife Onboarding
- [ ] Get Courtney set up with TestFlight
- [ ] Create her account
- [ ] Test real-time sync between devices
- [ ] Gather initial feedback

---

## Archived

> Completed items, rejected ideas, and closed discussions

### Completed

**January 2026 - Foundation:**
- [x] Vectors MVP data model design
- [x] Supabase project setup
- [x] Basic authentication flow
- [x] Recurring task logic
- [x] Real-time sync implementation
- [x] Basic task CRUD operations

**January 2026 - UI Overhaul:**
- [x] Design system created (theme/index.js)
- [x] UI libraries added (reanimated, haptics, bottom-sheet)
- [x] Component architecture (TaskCard, Badge, FilterBar, QuickAddBar, EmptyState)
- [x] useHaptics hook created
- [x] Animated interactions (checkbox, press feedback)

**January 2026 - Sprint 1 (Status Field):**
- [x] Add status field to tasks table
- [x] Status picker in Add/Edit modals
- [x] Status display in task metadata

**January 2026 - Sprint 2 (Swimlanes):**
- [x] Group By dropdown implementation
- [x] Swimlane headers with colors
- [x] Collapse/expand functionality
- [x] Group by: Assignee, Priority, Status, Due Date

**January 2026 - Sprint 3 (Kanban):**
- [x] View mode toggle (List/Kanban)
- [x] Kanban column layout
- [x] Horizontal scrolling
- [x] Card design with task details
- [x] Tap-to-edit from Kanban

**January 2026 - Sprint 4 (Boards):**
- [x] Boards table and RLS policies
- [x] Board selector UI
- [x] Create board modal with icon/color picker
- [x] Filter tasks by board
- [x] Long-press to delete board

**January 2026 - Drag & Drop:**
- [x] react-native-draggable-flatlist integration
- [x] Manual sort mode
- [x] sort_order persistence to Supabase
- [x] Drag handle UI

### Rejected Ideas
*None yet*

### Closed Questions
*None yet*

---

# Claude Code Cheat Sheet

> Quick reference for working with Claude on Vectors

### Project Locations

```
Vectors Root:
/Users/wallyhansen/Desktop/projects/riversideco/homebase/vectors/

Key Files:
├── App.js                     # Main entry (auth, navigation, GestureHandler)
├── app.json                   # Expo config (bundle ID, splash, icons)
├── package.json               # Dependencies (55+ packages)
├── eas.json                   # Expo Application Services config
├── .env                       # Supabase credentials
├── README.md                  # Setup documentation
├── QUICKSTART.md              # Getting started guide
├── TESTING_NOTES.md           # Feature testing checklist
├── IMPLEMENTATION_PLAN.md     # Boards/Swimlanes/Kanban plan
├── backlog.md                 # This file
│
├── /screens
│   ├── TaskListScreen.js      # Main UI (3160+ lines - all features)
│   └── LoginScreen.js         # Auth UI
│
├── /components
│   ├── index.js               # Component exports
│   ├── TaskCard.js            # Animated task card
│   ├── QuickAddBar.js         # Quick-add input
│   ├── FilterBar.js           # Filter + sort controls
│   ├── Badge.js               # Reusable badge/chip
│   └── EmptyState.js          # Empty state with animation
│
├── /hooks
│   └── useHaptics.js          # Haptic feedback hook
│
├── /lib
│   └── supabase.js            # Supabase client init
│
├── /theme
│   └── index.js               # Design system (colors, typography, spacing)
│
└── /assets                    # App icons and splash screens

Parent Homebase Docs:
/Users/wallyhansen/Desktop/projects/riversideco/homebase/
├── HOMEBASE_PROJECT_BRIEF.md  # Vision, cornerstones, principles
├── HOMEBASE_DEVELOPMENT_PLAN.md # Architecture, roadmap
└── BACKLOG.md                 # Platform-level backlog
```

### Quick Start Prompts

**Resume a Vectors session:**
```
Read the vectors backlog.md and explore the vectors/ codebase.
I want to continue working on [specific feature].
```

**Start a new feature:**
```
Read vectors/backlog.md for context. I want to add [feature].
Walk me through the implementation approach.
```

**Debug an issue:**
```
Read vectors/backlog.md and the relevant code in vectors/screens/TaskListScreen.js.
I'm seeing [describe bug]. Help me fix it.
```

**UI/styling work:**
```
Read vectors/theme/index.js and vectors/components/TaskCard.js.
I want to update [specific UI element].
```

**Database changes:**
```
Read vectors/IMPLEMENTATION_PLAN.md for the DB schema patterns.
I need to add [new field/table] to support [feature].
```

**Architecture question:**
```
Read vectors/backlog.md and explore the codebase structure.
I'm thinking about [architectural decision]. What are the tradeoffs?
```

### Tech Stack Reference

| Layer | Technology | Version | Docs |
|-------|------------|---------|------|
| **Framework** | React Native | 0.81.5 | reactnative.dev |
| **Platform** | Expo | 54.0.0 | docs.expo.dev |
| **UI Library** | React | 19.1.0 | react.dev |
| **Navigation** | React Navigation | 6.1.9 | reactnavigation.org |
| **Animations** | Reanimated | 4.1.1 | docs.swmansion.com/react-native-reanimated |
| **Gestures** | Gesture Handler | 2.28.0 | docs.swmansion.com/react-native-gesture-handler |
| **Drag & Drop** | Draggable FlatList | 4.0.1 | github.com/computerjazz/react-native-draggable-flatlist |
| **Bottom Sheet** | @gorhom/bottom-sheet | 5.1.2 | gorhom.dev/react-native-bottom-sheet |
| **Haptics** | expo-haptics | 15.0.8 | docs.expo.dev/versions/latest/sdk/haptics |
| **Backend** | Supabase | 2.39.3 | supabase.com/docs |
| **Database** | PostgreSQL | - | Via Supabase |
| **Auth** | Supabase Auth | - | Email/password |
| **Realtime** | Supabase Realtime | - | Postgres LISTEN/NOTIFY |
| **Storage** | AsyncStorage | 2.2.0 | Local persistence |
| **Secure Storage** | expo-secure-store | 15.0.8 | Credentials |
| **Date Picker** | DateTimePicker | 8.4.4 | @react-native-community |
| **QR Codes** | react-native-qrcode-svg | 6.3.21 | Partner invites |

### Common Commands

```bash
# Navigate to project
cd "/Users/wallyhansen/Desktop/projects/riversideco/homebase/vectors"

# Install dependencies
npm install

# Start development server
npx expo start

# Start with cache cleared
npx expo start -c

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Build for TestFlight (iOS)
eas build --platform ios --profile preview

# Build for internal testing (Android)
eas build --platform android --profile preview

# Submit to App Store
eas submit --platform ios

# Check Supabase project
# Dashboard: https://supabase.com/dashboard/project/eddnrkrvbbrbuzwxlgfc
```

### Data Model Quick Reference

**Core Tables:**

```sql
-- tasks: Main task data
tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  user_id UUID,              -- Creator
  assigned_to TEXT,          -- 'me', 'you', 'us'
  due_date TIMESTAMPTZ,
  priority TEXT,             -- 'high', 'medium', 'low', 'none'
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done'
  recurring TEXT,            -- 'daily', 'weekly', 'monthly', 'none'
  board_id BIGINT,           -- FK to boards
  sort_order INTEGER         -- Manual ordering
)

-- boards: Custom task boards
boards (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '📋',
  sort_order INTEGER DEFAULT 0,
  is_shared BOOLEAN DEFAULT FALSE
)

-- partnerships: Couple connections
partnerships (
  id BIGSERIAL PRIMARY KEY,
  user1_id UUID,
  user2_id UUID,
  user1_display_name TEXT,
  user2_display_name TEXT
)

-- task_activity: Audit log
task_activity (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT,
  user_id UUID,
  user_email TEXT,
  action TEXT,               -- 'created', 'updated', 'completed', etc.
  details JSON,
  created_at TIMESTAMPTZ
)
```

**Key Patterns:**
- All tables have RLS enabled (Row Level Security)
- Tasks visible to both partners in a partnership
- Real-time subscriptions on tasks table
- Assignment uses enum strings, not foreign keys
- Boards owned by creator, optionally shared

**Assignment Colors:**
- Me: Purple (#8B5CF6)
- You: Pink (#EC4899)
- Us: Green (#10B981)

**Priority Colors:**
- High: Red (#EF4444)
- Medium: Amber (#F59E0B)
- Low: Blue (#3B82F6)
- None: Gray (#6B7280)

### Session Tips

1. **Be specific:** "Fix spacing in TaskCard header" > "Make it look better"
2. **Reference files:** Tell Claude exactly which files to read
3. **One feature at a time:** Complete and test before moving on
4. **Test on device:** Simulator misses touch feel and haptics
5. **Commit often:** Small, working commits > big refactors
6. **Check backlog:** Update this file as you work

### Session Checkpoint and Restart Templates

**End of Session Checkpoint:**
```
Before we stop, let's update vectors/backlog.md:
1. Move completed items to Archived
2. Add any new bugs discovered
3. Update In Production if features shipped
4. Note where we left off
```

**Session Restart Template:**
```
I'm resuming work on Vectors. Read:
1. vectors/backlog.md (this file)
2. vectors/screens/TaskListScreen.js (main screen)

Last session we [brief summary].
Today I want to [specific goal].
```

**Bug Report Template:**
```
## Bug: [Short description]
**Steps to reproduce:**
1.
2.
3.

**Expected:**
**Actual:**
**Device/OS:**
**Screenshot:** (if applicable)
```

**Feature Request Template:**
```
## Feature: [Name]
**Problem:** What pain point does this solve?
**Solution:** How should it work?
**Scope:** Minimal viable version vs full version
**Files likely affected:**
```

---

*Last Updated: January 2026*
