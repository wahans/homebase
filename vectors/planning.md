# Vectors - Planning

> Couples task manager app - the first Homebase cornerstone for Riverside Co.

---

## Project Setup Checklist

> Complete these items before starting any development work. Based on best practices from [Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices), [Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/), [Claude Code Tips](https://github.com/ykdojo/claude-code-tips), and community research.

### Phase 0: Pre-Planning

- [x] **Begin in plan mode** - IMPLEMENTATION_PLAN.md exists with feature specs
- [x] **Create spec.md** - Detailed implementation plan and data models documented
- [x] **Tech stack established** - React Native/Expo + Supabase

### Phase 1: Project Structure Setup

- [x] **Directory structure** - React Native/Expo structure:
  ```
  vectors/
  ├── App.js                   # Main entry (auth, navigation, GestureHandler)
  ├── app.json                 # Expo config (bundle ID, splash, icons)
  ├── eas.json                 # Expo Application Services config
  ├── .env                     # Supabase credentials
  ├── screens/
  │   ├── TaskListScreen.js    # Main UI (3160+ lines)
  │   └── LoginScreen.js       # Auth UI
  ├── components/
  │   ├── TaskCard.js          # Animated task card
  │   ├── QuickAddBar.js       # Quick-add input
  │   ├── FilterBar.js         # Filter + sort controls
  │   ├── Badge.js             # Reusable badge/chip
  │   └── EmptyState.js        # Empty state with animation
  ├── hooks/
  │   └── useHaptics.js        # Haptic feedback hook
  ├── lib/
  │   └── supabase.js          # Supabase client init
  ├── theme/
  │   └── index.js             # Design system
  ├── assets/                  # App icons and splash screens
  ├── BACKLOG.md               # Feature tracking
  ├── IMPLEMENTATION_PLAN.md   # Technical specs
  ├── TESTING_NOTES.md         # Test checklist
  └── README.md                # Setup docs
  ```

- [x] **Create backlog.md** - Comprehensive BACKLOG.md in place
- [ ] **Create CLAUDE.md** - Project conventions and gotchas

### Phase 2: Workflow Setup

- [x] **Session templates** - Checkpoint and restart templates in BACKLOG.md
- [ ] **Set up handoff system** - Full session continuity
- [ ] **Context compaction agent** - Auto-trigger at 75% context usage

### Phase 3: Development Standards

- [x] **Testing strategy** - TESTING_NOTES.md with feature checklist
- [x] **Git workflow** - Repository initialized
- [ ] **Dual review pattern** - Set up second AI reviewer

### Phase 4: Post-Planning Setup

- [ ] **Create /init file** - Context optimization file for new sessions

---

## Default Tech Stack

| Category | Technology | Version | Notes |
|----------|------------|---------|-------|
| **Framework** | React Native | 0.81.5 | Cross-platform mobile |
| **Platform** | Expo | 54.0.0 | Managed workflow |
| **UI Library** | React | 19.1.0 | Component framework |
| **Navigation** | React Navigation | 6.1.9 | Screen management |
| **Animations** | Reanimated | 4.1.1 | Smooth interactions |
| **Gestures** | Gesture Handler | 2.28.0 | Touch handling |
| **Drag & Drop** | Draggable FlatList | 4.0.1 | Manual reordering |
| **Bottom Sheet** | @gorhom/bottom-sheet | 5.1.2 | Modal sheets |
| **Haptics** | expo-haptics | 15.0.8 | Tactile feedback |
| **Backend** | Supabase | 2.39.3 | BaaS |
| **Database** | PostgreSQL | - | Via Supabase |
| **Auth** | Supabase Auth | - | Email/password |
| **Realtime** | Supabase Realtime | - | Live sync |
| **Build** | EAS | - | TestFlight/Play Store |

---

## Vision

A dead-simple task manager for couples. Replace Trello's complexity with an app optimized for speed and partner collaboration. "Vectors" comes from how the couple describes responsibility splits (e.g., "user handles cars, wife handles laundry").

---

## Architecture

```
vectors/
├── App.js                     # Root: Auth + Navigation + Providers
│
├── screens/
│   ├── TaskListScreen.js      # Main screen (all features)
│   │   ├── Task CRUD
│   │   ├── Boards
│   │   ├── Swimlanes
│   │   ├── Kanban view
│   │   ├── Drag & drop
│   │   └── Real-time sync
│   └── LoginScreen.js         # Auth flow
│
├── components/                # Reusable UI
│   ├── TaskCard.js            # Animated card with haptics
│   ├── QuickAddBar.js         # Fast task creation
│   ├── FilterBar.js           # Sort/filter/view controls
│   ├── Badge.js               # Status/priority chips
│   └── EmptyState.js          # Friendly empty states
│
├── hooks/
│   └── useHaptics.js          # Centralized haptic feedback
│
├── theme/
│   └── index.js               # Colors, typography, spacing
│
└── Supabase Backend
    ├── tasks                  # Task storage
    ├── boards                 # Custom boards
    ├── partnerships           # Couple connections
    └── task_activity          # Audit log
```

---

## Core Capabilities

### In Production (TestFlight)
- Task creation via quick-add or detailed modal
- Task editing with full property support
- Task completion with haptic feedback
- Task archiving
- Real-time sync between devices
- Email/password authentication
- Partnership system (invite codes)

### Task Properties
- Title and description
- Due dates with date picker
- Priority levels (High, Medium, Low, None)
- Assignment (Me, You, Us)
- Status (To Do, In Progress, Done)
- Recurring options (Daily, Weekly, Monthly)
- Board association
- Manual sort order

### Organization
- Boards with custom icons and colors
- Swimlane grouping (Assignee, Priority, Status, Due Date)
- Collapsible groups
- Kanban view toggle
- Multiple sort options
- Search (title and description)
- Filter by assignment

### UX Polish
- Haptic feedback throughout
- Spring animations
- Drag-and-drop reordering
- Color-coded assignments and priorities
- Overdue task highlighting
- Empty state animations

---

## Design System

### Assignment Colors
- Me: Purple (#8B5CF6)
- You: Pink (#EC4899)
- Us: Green (#10B981)

### Priority Colors
- High: Red (#EF4444)
- Medium: Amber (#F59E0B)
- Low: Blue (#3B82F6)
- None: Gray (#6B7280)

---

## Current Priorities

### Immediate: Wife Onboarding
1. Get Courtney set up with TestFlight
2. Create her account
3. Test real-time sync between devices
4. Gather initial feedback

### UI Fixes Needed
- Tag display consistency (dots vs full tags)
- Manual sort spacing on mobile
- Search bar spacing adjustments

### Next Features
- Push notifications
- Voice input for quick task creation
- Location-based reminders
- Swipe gestures (right=complete, left=assign)

---

## Open Questions

1. **Assignment clarity:** "Us" = either can complete OR do together?
2. **Notification philosophy:** How aggressive? Partner alerts default on?
3. **Offline behavior:** What works offline? Conflict resolution?
4. **Recurring task UX:** Auto-generate next instance immediately or at scheduled time?
5. **Auth revamp:** Magic link only? Remove email/password option?

---

## Data Model

```sql
-- tasks
tasks (
  id, created_at, title, description,
  completed, archived, user_id,
  assigned_to,  -- 'me', 'you', 'us'
  due_date, priority, status,
  recurring, board_id, sort_order
)

-- boards
boards (
  id, created_at, name, user_id,
  color, icon, sort_order, is_shared
)

-- partnerships
partnerships (
  id, user1_id, user2_id,
  user1_display_name, user2_display_name
)

-- task_activity (audit log)
task_activity (
  id, task_id, user_id, user_email,
  action, details, created_at
)
```

---

## Milestones

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | MVP data model + auth | Complete |
| 2 | Core task CRUD | Complete |
| 3 | UI overhaul + design system | Complete |
| 4 | Status field + swimlanes | Complete |
| 5 | Kanban view | Complete |
| 6 | Boards system | Complete |
| 7 | Drag & drop | Complete |
| 8 | Wife onboarding | In Progress |
| 9 | Push notifications | Planned |
| 10 | Voice input | Planned |

---

## Notes

*Last Updated: January 2026*
*Status: MVP Complete, TestFlight available*
*Users: Wally (testing), Courtney (pending onboarding)*

