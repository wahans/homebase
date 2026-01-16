# Homebase - Planning

> Comprehensive family operating system - unified platform for managing family life for Riverside Co.

---

## Project Setup Checklist

> Complete these items before starting any development work. Based on best practices from [Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices), [Addy Osmani](https://addyosmani.com/blog/ai-coding-workflow/), [Claude Code Tips](https://github.com/ykdojo/claude-code-tips), and community research.

### Phase 0: Pre-Planning

- [x] **Begin in plan mode** - Project brief and development plan created
- [x] **Create spec.md** - HOMEBASE_PROJECT_BRIEF.md and HOMEBASE_DEVELOPMENT_PLAN.md exist
- [x] **Tech stack established** - React Native/Expo + Supabase for Vectors MVP

### Phase 1: Project Structure Setup

- [x] **Directory structure** - Platform structure:
  ```
  homebase/
  ├── vectors/                 # First app - couples task manager (MVP Complete)
  ├── HOMEBASE_PROJECT_BRIEF.md
  ├── HOMEBASE_DEVELOPMENT_PLAN.md
  ├── BACKLOG.md
  └── checkpoint.sh
  ```

- [x] **Create backlog.md** - Platform-level backlog in place
- [ ] **Create CLAUDE.md** - Project conventions and gotchas

### Phase 2: Workflow Setup

- [x] **Session scripts** - checkpoint.sh exists
- [ ] **Set up handoff system** - Full session continuity system
- [ ] **Context compaction agent** - Auto-trigger at 75% context usage

### Phase 3: Development Standards

- [ ] **Testing strategy** - Define test approach
- [x] **Git workflow** - Repository initialized
- [ ] **Dual review pattern** - Set up second AI reviewer

### Phase 4: Post-Planning Setup

- [ ] **Create /init file** - Context optimization file for new sessions

---

## Default Tech Stack

| Category | Current Choice | Notes |
|----------|----------------|-------|
| **Mobile** | React Native 0.81.5 + Expo 54 | Primary platform |
| **Backend** | Supabase | PostgreSQL + Auth + Realtime |
| **Database** | PostgreSQL | Via Supabase with RLS |
| **Auth** | Supabase Auth | Email/password |
| **Realtime** | Supabase Realtime | Postgres LISTEN/NOTIFY |
| **Animations** | Reanimated 4.1.1 | Smooth interactions |
| **Gestures** | Gesture Handler 2.28.0 | Touch handling |
| **Navigation** | React Navigation 6.1.9 | Screen management |
| **Build** | EAS | Expo Application Services |

---

## Vision

A comprehensive family operating system that replaces fragmented tools (Trello, Monarch Money, Google Calendar, document storage) with purpose-built, privacy-first apps that work together. The platform integrates multiple standalone apps into one seamless interface for managing family life.

---

## The Four Cornerstones

### 1. Finance Cornerstone
**Replaces:** Monarch Money, Copilot, YNAB, Empower/Tilt
- Bank/credit card integration (Plaid API)
- Auto-categorization with manual override
- Budget tracking and alerts
- Multi-user (husband + wife shared view)
- Export functionality

### 2. Calendar Cornerstone
**Problem:** Managing separate work calendars as personal calendars
- Multi-provider integration (Google Cal, Outlook, Apple)
- Unified family view
- Event categorization
- Conflict detection
- Mobile widgets

### 3. Medical Cornerstone
**Core Concept:** Family medical information hub + intelligent health advisor
- Medical history per family member
- Doctor/hospital directory
- Medication tracking
- DNA/genetic data integration
- Proactive health recommendations
- Privacy-critical: local-first, encrypted

### 4. Search Cornerstone (THE SECRET SAUCE)
**Core Concept:** Powerfully searchable engine for family documents AND all Homebase data
- Natural language queries across all apps
- Document OCR and full-text search
- QR code integration for physical storage
- Vector database for semantic search
- Claude API for understanding

---

## Architecture

```
homebase/
├── vectors/                   # Couples task manager (MVP Complete)
│   ├── App.js                 # Entry point
│   ├── screens/               # TaskListScreen, LoginScreen
│   ├── components/            # TaskCard, QuickAddBar, FilterBar
│   ├── hooks/                 # useHaptics
│   ├── lib/                   # Supabase client
│   └── theme/                 # Design system
│
├── (Future Apps)
│   ├── finance/               # Spend tracking & budgeting
│   ├── calendar/              # Family calendar aggregation
│   ├── medical/               # Family medical app
│   ├── search/                # Family folder & search
│   ├── qr-storage/            # QR code storage manager
│   └── recipes/               # Recipe & grocery list
│
└── Supabase Backend
    ├── tasks                  # Vectors tasks
    ├── boards                 # Task boards
    ├── partnerships           # Couple connections
    └── task_activity          # Audit log
```

---

## Core Capabilities

### Vectors (MVP Complete - TestFlight)
- Task creation/editing/completion
- Due dates, priorities, assignments (Me/You/Us)
- Status tracking (To Do/In Progress/Done)
- Recurring tasks
- Boards with custom icons and colors
- Swimlane grouping (Assignee, Priority, Status, Due Date)
- Kanban view toggle
- Drag-and-drop reordering
- Real-time sync between devices
- Partnership system (invite codes)
- Haptic feedback throughout

### Planned Apps
- QR Storage Manager
- Location-Based Reminders
- Recipe & Grocery List
- Password Manager (optional)

---

## Technical Principles

### Privacy-First Architecture
- Local-first storage for sensitive data
- Self-hosted options where possible
- End-to-end encryption for sync
- Zero-knowledge architecture for credentials

### Integration Philosophy
- Each app works standalone first
- Integration is additive, not required
- Homebase is the "glue," not the foundation
- Cross-app search makes it magical

---

## Build Strategy

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Vectors MVP | Complete |
| 2 | Quick Wins (QR Storage, Location Reminders) | Not Started |
| 3 | Cornerstones (Calendar, Finance, Search, Medical) | Not Started |
| 4 | Integration Layer | Not Started |
| 5 | Extended Apps | Not Started |

---

## Current Priorities (Vectors)

### Immediate
1. Get wife (Courtney) set up with TestFlight
2. Test real-time sync between devices
3. Gather initial feedback

### UI Fixes
- Tag display consistency (colored dots vs full tags)
- Manual sort spacing on mobile
- Search bar spacing adjustments

### Next Features
- Push notifications
- Voice input
- Location-based reminders

---

## Open Questions

1. Assignment model: Should "Us" mean "either can complete" or "do together"?
2. Notification philosophy: How aggressive should reminders be?
3. Offline behavior: What works offline? Conflict handling?
4. Auth revamp: Magic link only vs email/password?

---

## Notes

*Last Updated: January 2026*
*Vectors Status: MVP Complete, TestFlight available*

