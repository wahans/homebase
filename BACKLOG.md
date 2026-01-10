# Homebase Backlog
*Living document for ideas, bugs, and project tracking*

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

### Vectors
- [ ] Swipe gestures: swipe right to complete, swipe left to assign to partner
- [ ] Task templates: "Grocery run" pre-populates common items
- [ ] Weekly review mode: guided walkthrough of incomplete tasks
- [ ] Task streaks: gamification for recurring tasks ("10 days of making bed!")
- [ ] Photo attachments on tasks

### Calendar
- [ ] Travel time auto-blocking between events
- [ ] "Busy" indicator showing both partners' availability at a glance
- [ ] Kid activity templates (soccer practice, dance class schedules)

### Finance
- [ ] Subscription tracker with renewal alerts
- [ ] Net worth dashboard
- [ ] Spending comparison month-over-month

### Medical
- [ ] Symptom journal with pattern detection
- [ ] Growth charts for kids
- [ ] Immunization schedule tracker

### Family Folder
- [ ] Document expiration alerts (passport, driver's license, insurance)
- [ ] Family member document inheritance ("if something happens to me")

### Platform
- [ ] Dark mode across all apps
- [ ] Family photo as dashboard background
- [ ] Weekly digest email summarizing activity

---

## Questions to Discuss

> Things to think through before implementing

1. **Vectors assignment model:** Should "both" mean "either of us can complete" or "we do it together"? Currently ambiguous.

2. **Calendar conflict handling:** When we both have events at the same time, how prominent should the warning be?

3. **Finance data retention:** How long to keep transaction history? Forever? 7 years (tax purposes)?

4. **Medical AI boundaries:** What health advice is safe to give? Need disclaimers?

5. **Search result ranking:** When a query matches multiple apps, how to order results?

6. **Notification philosophy:** How aggressive should reminders be? Partner completion alerts on by default?

7. **Offline behavior:** What works offline? What shows "waiting to sync"?

---

## Bugs

> Known issues to fix

### Vectors
- [ ] *No bugs tracked yet - add as discovered*

### Calendar
- [ ] *Not yet built*

### Finance
- [ ] *Not yet built*

### Medical
- [ ] *Not yet built*

### Family Folder
- [ ] *Not yet built*

---

## Low Priority / Nice to Have

> Good ideas that aren't urgent - revisit later

- [ ] Apple Watch complication for Vectors quick-add
- [ ] Siri/Google Assistant integration for voice commands outside app
- [ ] iPad-optimized layouts
- [ ] Web dashboard for desktop access
- [ ] Family member avatars/photos
- [ ] Customizable app icons per family
- [ ] Widget stacking for iOS home screen
- [ ] Share task completion to partner via iMessage
- [ ] Export all Homebase data to JSON (full backup)
- [ ] Import from Trello (migration helper)
- [ ] Import from Monarch Money (migration helper)
- [ ] Confetti animation on task completion
- [ ] Sound effects toggle
- [ ] Accessibility audit (VoiceOver, Dynamic Type)

---

## In Production

> What's currently deployed and usable

### Vectors MVP (TestFlight)
**Version:** 1.0.0 (MVP)
**Status:** TestFlight builds available
**Users:** Wally (testing), Courtney (not yet onboarded)

**Working Features:**
- Task creation and editing
- Assignment (me/partner/both)
- Due dates
- Recurring tasks (auto-generates next instance on completion)
- Real-time sync between devices
- Email/password authentication
- Household creation and joining

**Known Limitations:**
- UI needs overhaul (not production quality)
- No voice input
- Basic notifications only
- No drag-and-drop
- No card detail popups

### Calendar App
**Status:** Not started

### Finance App
**Status:** Not started

### Medical App
**Status:** Not started

### Family Folder
**Status:** Not started

### Homebase Platform Shell
**Status:** Not started

---

## Archived

> Completed items, rejected ideas, and closed discussions

### Completed
- [x] Vectors MVP data model design (Jan 2026)
- [x] Supabase project setup for Vectors (Jan 2026)
- [x] Basic authentication flow (Jan 2026)
- [x] Recurring task logic (Jan 2026)
- [x] Real-time sync implementation (Jan 2026)
- [x] HOMEBASE_PROJECT_BRIEF.md created (Jan 2026)
- [x] HOMEBASE_DEVELOPMENT_PLAN.md created (Jan 2026)
- [x] BACKLOG.md created with all sections (Jan 9, 2026)
- [x] Design system created - theme/index.js (Jan 9, 2026)
- [x] UI libraries added - reanimated, haptics, bottom-sheet (Jan 9, 2026)
- [x] Component architecture - TaskCard, Badge, FilterBar, QuickAddBar, EmptyState (Jan 9, 2026)
- [x] TasksScreen refactored with new components (Jan 9, 2026)
- [x] App.js updated with GestureHandler and streamlined navigation (Jan 9, 2026)
- [x] useHaptics hook created (Jan 9, 2026)
- [x] Drag-and-drop reordering with react-native-draggable-flatlist (Jan 9, 2026)
- [x] Manual sort mode with position persistence to Supabase (Jan 9, 2026)

### Rejected Ideas
*None yet*

### Closed Questions
*None yet*

---

## Claude Code Cheat Sheet

> Quick reference for working with Claude on Homebase

### Project Locations

```
Homebase Root:
/Users/wallyhansen/Desktop/personal/riverside co/homebase/

Key Files:
├── HOMEBASE_PROJECT_BRIEF.md      # Vision, cornerstones, principles
├── HOMEBASE_DEVELOPMENT_PLAN.md   # Architecture, roadmap, data models
├── BACKLOG.md                     # This file
└── vectors/                       # Vectors app codebase
    ├── App.js                     # Main app entry (auth, navigation)
    ├── app.json                   # Expo config
    ├── package.json               # Dependencies
    ├── theme/
    │   └── index.js               # Design system (colors, typography, spacing)
    ├── hooks/
    │   └── useHaptics.js          # Haptic feedback hook
    ├── components/
    │   ├── index.js               # Component exports
    │   ├── TaskCard.js            # Animated task card
    │   ├── Badge.js               # Reusable badge/chip
    │   ├── FilterBar.js           # Filter + sort controls
    │   ├── QuickAddBar.js         # Quick add input
    │   └── EmptyState.js          # Empty state display
    ├── screens/
    │   ├── LoginScreen.js         # Auth screen
    │   └── TasksScreen.js         # Main task list (refactored)
    └── lib/
        └── supabase.js            # Supabase client
```

### Quick Start Prompts

**Resume a session:**
```
Read HOMEBASE_PROJECT_BRIEF.md and HOMEBASE_DEVELOPMENT_PLAN.md to get context,
then let's continue working on [specific task].
```

**Start Vectors UI work:**
```
Read the Homebase docs, then explore the vectors/ codebase.
I want to work on [specific UI component].
```

**Start a new cornerstone:**
```
Read the Homebase docs, specifically the [Calendar/Finance/Medical/Search]
section in the development plan. Let's start building it.
```

**Debug something:**
```
Read the Homebase docs for context. I'm seeing [describe bug].
The relevant code is in vectors/[path]. Help me fix it.
```

**Add a feature:**
```
Read the Homebase docs. I want to add [feature] to [app].
Walk me through the implementation.
```

**Architecture question:**
```
Read HOMEBASE_DEVELOPMENT_PLAN.md. I'm thinking about [architectural decision].
What are the tradeoffs?
```

### Tech Stack Reference

| Layer | Technology | Docs |
|-------|------------|------|
| Mobile Framework | React Native + Expo 54 | expo.dev/docs |
| UI Components | Custom + theme system | vectors/theme/index.js |
| Animations | react-native-reanimated | docs.swmansion.com/react-native-reanimated |
| Gestures | react-native-gesture-handler | docs.swmansion.com/react-native-gesture-handler |
| Bottom Sheets | @gorhom/bottom-sheet | gorhom.dev/react-native-bottom-sheet |
| Haptics | expo-haptics | docs.expo.dev/versions/latest/sdk/haptics |
| Backend | Supabase | supabase.com/docs |
| Database | PostgreSQL | - |
| Auth | Supabase Auth | - |
| Realtime | Supabase Realtime | - |
| Local Storage | (Future: WatermelonDB) | - |
| Vector Search | pgvector | - |
| AI | Claude API | docs.anthropic.com |
| Builds | Expo EAS | - |

### Common Commands

```bash
# Navigate to project
cd "/Users/wallyhansen/Desktop/personal/riverside co/homebase"

# Vectors app
cd vectors
npm install
npx expo start

# Build for TestFlight
eas build --platform ios --profile preview

# Supabase CLI (if using)
supabase start
supabase db diff
supabase db push
```

### Data Model Quick Reference

**Vectors Tables:**
- `households` - Family groups
- `users` - Individual users, linked to household
- `tasks` - Tasks with assignment enum (me/partner/both)

**Key Patterns:**
- All tables have `household_id` for multi-tenancy
- Assignment uses enum, not foreign key (simpler for couples)
- Recurring tasks: parent_task_id links instances to template
- Timestamps: created_at, updated_at, completed_at

### Current Milestone

**Milestone 1: Vectors Polish**
- [x] Design system creation (theme/index.js)
- [x] Component architecture (TaskCard, Badge, FilterBar, etc.)
- [x] Card detail bottom sheet (replaces modal)
- [x] Animated interactions (checkbox, press feedback)
- [x] Haptic feedback integration
- [x] Drag-and-drop reordering (Manual sort mode)
- [ ] Voice input
- [ ] Better notifications
- [ ] Wife onboarding

### Session Tips

1. **Be specific:** "Fix the task list spacing" > "Make it look better"
2. **Reference the docs:** Claude can re-read the brief/plan anytime
3. **One thing at a time:** Complete a feature before starting the next
4. **Test on device:** Simulator misses touch/haptic feel
5. **Commit often:** Small, working commits > big refactors

---

*Last Updated: January 2026*
