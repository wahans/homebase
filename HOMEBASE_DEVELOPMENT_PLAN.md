# Homebase Development Plan
*Comprehensive roadmap for the family operating system*

---

## Executive Summary

**Homebase** is a privacy-first family operating system built to replace fragmented tools (Trello, Monarch Money, scattered calendars, paper documents) with a unified, searchable platform.

### Key Findings from Discovery

| Area | Decision |
|------|----------|
| **First Priority** | Vectors UI/UX overhaul (premium feel, satisfying interactions) |
| **Next App** | Calendar Aggregation (Google + Outlook two-way sync) |
| **Architecture** | Separate databases per app, unified Search cornerstone |
| **Privacy Model** | Local-first with encrypted cloud backup |
| **Search Strategy** | Full-text + semantic (pgvector + Claude API) |
| **Success Metric** | Wife uses it daily, magical search works |

### Current Stack
- **Frontend:** React Native + Expo
- **Backend:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password)
- **Sync:** Supabase Realtime (WebSockets)
- **Deployment:** Expo/EAS (TestFlight builds)

---

## Current State Assessment

### Vectors MVP Status

**What Exists:**
- Task creation and management
- Assignment model (me/partner/both enum)
- Recurring tasks with auto-generation of next instance
- Real-time sync between devices
- Basic authentication and household grouping

**What's Working:**
- Data model is sound (enum assignment is simpler than foreign keys)
- Supabase backend is reliable
- Real-time sync functions correctly
- Recurring task logic is solid

**What Needs Work:**
- UI/UX does not meet quality bar (target: Notion/Airtable polish)
- Missing satisfying card interactions (drag-and-drop, detail popups)
- No voice input for quick task capture
- Notification system needs improvement
- Wife hasn't started using it yet (critical adoption milestone)

### Technical Debt Assessment
- UI components need complete overhaul
- Backend and data layer are solid foundations to keep
- Auth and sync infrastructure can remain unchanged

---

## Technical Architecture

### Platform Architecture

```
+------------------------------------------------------------------+
|                         HOMEBASE PLATFORM                         |
|  +------------------------------------------------------------+  |
|  |                    SEARCH CORNERSTONE                       |  |
|  |         (Federated search across all app databases)         |  |
|  |         Full-text (pg_trgm) + Semantic (pgvector)          |  |
|  |                    + Claude API for NLQ                     |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|     +------------+------------+------------+------------+         |
|     |            |            |            |            |         |
|  +------+   +--------+   +--------+   +---------+   +-------+    |
|  |Vectors|   |Calendar|   |Finance |   | Medical |   |Family |    |
|  | App   |   |  App   |   |  App   |   |   App   |   |Folder |    |
|  +------+   +--------+   +--------+   +---------+   +-------+    |
|     |            |            |            |            |         |
|  +------+   +--------+   +--------+   +---------+   +-------+    |
|  |Supabase|  |Supabase|  |Supabase|  | Local +  |   |Supabase|   |
|  |  DB    |  |  DB    |  |  DB    |  | Backup   |   |  DB    |   |
|  +------+   +--------+   +--------+   +---------+   +-------+    |
+------------------------------------------------------------------+
```

### Database Strategy

**Separate Databases Per App** (chosen approach):
- Each cornerstone has its own Supabase project
- Enables independent deployment and scaling
- Allows different security postures (Medical is most locked down)
- Search cornerstone federates queries across all databases
- Easier to reason about data ownership and privacy

**Multi-tenancy from Day One:**
- Even with one family, design for `household_id` isolation
- Enables eventual commercialization without refactoring
- Pattern: All tables have `household_id` foreign key

### Privacy Architecture

**Local-First with Cloud Backup:**

```
+-------------+     +------------------+     +----------------+
|   Device    |     |   Encryption     |     |   Supabase     |
|   (SQLite)  | --> |   Layer (E2E)    | --> |   (Backup/Sync)|
|   PRIMARY   |     |                  |     |   SECONDARY    |
+-------------+     +------------------+     +----------------+
```

**Implementation:**
- Local SQLite via Expo SQLite or WatermelonDB
- End-to-end encryption before any data leaves device
- Supabase stores encrypted blobs for sync
- Decryption only happens on-device with user's key

**Privacy Tiers by App:**

| App | Privacy Level | Storage |
|-----|---------------|---------|
| Vectors | Standard | Supabase (encrypted at rest) |
| Calendar | Standard | Supabase + OAuth tokens |
| Finance | High | Local-first + encrypted backup |
| Medical | Critical | Local-first + encrypted backup |
| Family Folder | High | Local-first + encrypted backup |

### Technology Recommendations

**Keep (Proven):**
- React Native + Expo (cross-platform, good DX)
- Supabase (PostgreSQL, auth, realtime, pgvector)
- Expo/EAS (build infrastructure)

**Add for UI Overhaul:**
- Consider: Tamagui or NativeWind for styling (fast, customizable)
- Consider: React Native Reanimated for satisfying animations
- Consider: React Native Gesture Handler for drag-and-drop

**Add for Local-First:**
- WatermelonDB or Expo SQLite for local storage
- Custom sync layer or PowerSync for sync
- libsodium (via react-native-sodium) for encryption

**Add for Search:**
- pgvector extension in Supabase for semantic search
- Claude API for natural language query interpretation
- Embedding generation (likely via Claude or OpenAI)

**Add for Calendar:**
- Google Calendar API (OAuth 2.0)
- Microsoft Graph API (OAuth 2.0 for Outlook)

---

## Prioritized Roadmap

### Milestone 1: Vectors Polish (Foundation)
*Goal: Wife uses Vectors daily*

**1.1 UI/UX Overhaul**
- [ ] Design system creation (colors, typography, spacing)
- [ ] New list view with Notion-quality polish
- [ ] Card detail popup with smooth animations
- [ ] Satisfying drag-and-drop interactions
- [ ] Empty states and loading states
- [ ] Haptic feedback on interactions

**1.2 Core UX Improvements**
- [ ] Better task quick-add flow
- [ ] Improved assignment UI (me/you/us)
- [ ] Due date picker improvements
- [ ] Recurring task visualization

**1.3 Notifications**
- [ ] Push notification infrastructure
- [ ] Partner completion alerts ("Courtney completed: Buy groceries")
- [ ] Smart reminders (time-based)
- [ ] Notification preferences

**1.4 Voice Input**
- [ ] Voice-to-task capture
- [ ] Natural language parsing ("Add milk to grocery list for tomorrow")
- [ ] Quick-add via voice button

**1.5 Wife Onboarding**
- [ ] Smooth onboarding flow
- [ ] Household invite/join flow
- [ ] First-run tutorial
- [ ] Gather feedback, iterate

**Exit Criteria:** Wife opens Vectors naturally when she needs to add or check tasks. Trello usage drops significantly.

---

### Milestone 2: Calendar Cornerstone
*Goal: See both calendars in one place, create events that sync back*

**2.1 Calendar Infrastructure**
- [ ] New Supabase project for Calendar app
- [ ] OAuth implementation for Google Calendar
- [ ] OAuth implementation for Microsoft Graph (Outlook)
- [ ] Token storage and refresh logic

**2.2 Read Integration**
- [ ] Fetch events from Google Calendar
- [ ] Fetch events from Outlook Calendar
- [ ] Unified event data model
- [ ] Combined calendar view (day, week, month)

**2.3 Write Integration**
- [ ] Create events in app, sync to selected calendar
- [ ] Edit events, propagate changes
- [ ] Delete events with sync
- [ ] Conflict detection ("You both have events at 6pm")

**2.4 Family Features**
- [ ] Color-coding by person and calendar source
- [ ] Event categorization (work, family, kids, medical)
- [ ] Shared family calendar creation
- [ ] Widget for quick glance

**Exit Criteria:** "Are we free Saturday?" can be answered by opening one app.

---

### Milestone 3: Family Folder (Search Foundation)
*Goal: Upload documents, find them with natural language*

**3.1 Document Storage**
- [ ] New Supabase project for Family Folder
- [ ] Document upload (photos, PDFs)
- [ ] OCR pipeline for text extraction
- [ ] Document categorization (insurance, medical, legal, etc.)
- [ ] Local-first storage with encrypted backup

**3.2 Full-Text Search**
- [ ] PostgreSQL full-text search setup
- [ ] Search across document content
- [ ] Search UI with filters

**3.3 Semantic Search**
- [ ] pgvector setup in Supabase
- [ ] Document embedding generation
- [ ] Natural language query parsing via Claude
- [ ] "Where is my car title?" type queries

**3.4 Cross-App Search**
- [ ] Federated search across Vectors tasks
- [ ] Federated search across Calendar events
- [ ] Unified search results UI

**Exit Criteria:** "Where did I store the birth certificate?" returns the document.

---

### Milestone 4: Finance Cornerstone
*Goal: See all transactions, categorized, exportable*

**4.1 Infrastructure**
- [ ] New Supabase project for Finance
- [ ] Local-first data architecture
- [ ] Plaid API integration for bank connections

**4.2 Transaction Management**
- [ ] Automatic transaction import
- [ ] Smart auto-categorization
- [ ] Manual category override (persists per merchant)
- [ ] Transaction search and filtering

**4.3 Budgeting**
- [ ] Budget creation by category
- [ ] Spending vs. budget visualization
- [ ] Alerts when approaching limits

**4.4 Reporting**
- [ ] Monthly/quarterly spending summaries
- [ ] Category breakdown charts
- [ ] Export to CSV/Excel for external analysis

**4.5 Search Integration**
- [ ] "How much did we spend on dining in December?"
- [ ] Transaction search from unified Search

**Exit Criteria:** Monarch Money subscription cancelled. Quarterly financial reviews use Homebase export.

---

### Milestone 5: Medical Hub
*Goal: Family health records accessible, searchable, eventually advisory*

**5.1 Records Foundation**
- [ ] Medical app with local-first architecture
- [ ] Family member profiles
- [ ] Doctor/provider directory
- [ ] Insurance information storage
- [ ] Medication tracking

**5.2 Document Management**
- [ ] Medical document upload (lab results, imaging, prescriptions)
- [ ] OCR and data extraction
- [ ] Document categorization by type and family member

**5.3 23andMe Integration**
- [ ] Raw data import from 23andMe
- [ ] Genetic marker parsing
- [ ] Health risk identification

**5.4 AI Health Advisor (Advanced)**
- [ ] Health question answering via Claude
- [ ] Proactive insights (genetics + history + lifestyle)
- [ ] Diet and exercise recommendations
- [ ] Checkup and screening reminders based on age/genetics

**Exit Criteria:** "What medications is [daughter] allergic to?" returns accurate answer. Proactive health nudges feel valuable.

---

### Milestone 6: Integration & Polish
*Goal: Homebase feels like one product, not four apps*

**6.1 Unified Experience**
- [ ] Homebase shell/dashboard
- [ ] Cross-app navigation
- [ ] Unified notification center
- [ ] Consistent design language across all apps

**6.2 Advanced Search**
- [ ] Search across ALL Homebase data
- [ ] Complex queries ("What's covered by my home insurance?")
- [ ] Query history and saved searches

**6.3 Cross-App Features**
- [ ] Calendar: medical appointment reminders
- [ ] Finance: recurring payment alerts on calendar
- [ ] Vectors: budget-aware task creation
- [ ] Medical: diet recommendations to recipe app (future)

**Exit Criteria:** Asking any question about family life returns an answer.

---

## Data Model Recommendations

### Vectors (Current - Keep)

```sql
-- households
CREATE TABLE households (
  id UUID PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP
);

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT,
  household_id UUID REFERENCES households(id),
  display_name TEXT
);

-- tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  household_id UUID REFERENCES households(id),
  title TEXT NOT NULL,
  description TEXT,
  assignment TEXT CHECK (assignment IN ('me', 'partner', 'both')),
  due_date TIMESTAMP,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  recurring_pattern TEXT, -- 'daily', 'weekly', 'monthly', etc.
  parent_task_id UUID REFERENCES tasks(id), -- for recurring instances
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP
);
```

### Calendar

```sql
-- calendar_sources
CREATE TABLE calendar_sources (
  id UUID PRIMARY KEY,
  household_id UUID,
  user_id UUID,
  provider TEXT CHECK (provider IN ('google', 'outlook', 'apple')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  calendar_id TEXT, -- external calendar ID
  display_name TEXT,
  color TEXT,
  is_writable BOOLEAN
);

-- events (local cache + homebase-created events)
CREATE TABLE events (
  id UUID PRIMARY KEY,
  household_id UUID,
  source_id UUID REFERENCES calendar_sources(id),
  external_id TEXT, -- ID from Google/Outlook
  title TEXT,
  description TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  all_day BOOLEAN,
  location TEXT,
  category TEXT,
  attendees JSONB,
  is_local_only BOOLEAN DEFAULT false, -- true for homebase-created events not yet synced
  last_synced_at TIMESTAMP
);
```

### Family Folder

```sql
-- documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  household_id UUID,
  title TEXT,
  category TEXT, -- 'insurance', 'medical', 'legal', 'financial', 'personal'
  subcategory TEXT,
  file_path TEXT, -- local path (local-first)
  file_hash TEXT, -- for sync verification
  ocr_text TEXT, -- extracted text for search
  metadata JSONB, -- expiration dates, policy numbers, etc.
  embedding VECTOR(1536), -- for semantic search
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- physical_locations (QR code storage system)
CREATE TABLE physical_locations (
  id UUID PRIMARY KEY,
  household_id UUID,
  qr_code TEXT UNIQUE,
  name TEXT, -- "Garage bin 3", "Filing cabinet drawer 2"
  description TEXT
);

-- document_locations
CREATE TABLE document_locations (
  document_id UUID REFERENCES documents(id),
  location_id UUID REFERENCES physical_locations(id),
  PRIMARY KEY (document_id, location_id)
);
```

### Finance

```sql
-- accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  household_id UUID,
  plaid_account_id TEXT,
  name TEXT,
  type TEXT, -- 'checking', 'savings', 'credit', 'investment'
  institution TEXT,
  mask TEXT, -- last 4 digits
  current_balance DECIMAL
);

-- transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  household_id UUID,
  account_id UUID REFERENCES accounts(id),
  plaid_transaction_id TEXT,
  amount DECIMAL,
  date DATE,
  merchant_name TEXT,
  category_id UUID REFERENCES categories(id),
  auto_categorized BOOLEAN,
  notes TEXT,
  embedding VECTOR(1536) -- for semantic search
);

-- categories
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  household_id UUID,
  name TEXT,
  parent_id UUID REFERENCES categories(id), -- for subcategories
  icon TEXT,
  color TEXT,
  budget_amount DECIMAL,
  budget_period TEXT -- 'monthly', 'weekly'
);

-- merchant_rules (for persistent categorization)
CREATE TABLE merchant_rules (
  id UUID PRIMARY KEY,
  household_id UUID,
  merchant_pattern TEXT, -- regex or exact match
  category_id UUID REFERENCES categories(id)
);
```

### Medical

```sql
-- family_members
CREATE TABLE family_members (
  id UUID PRIMARY KEY,
  household_id UUID,
  name TEXT,
  date_of_birth DATE,
  blood_type TEXT,
  allergies JSONB,
  emergency_contact JSONB
);

-- providers
CREATE TABLE providers (
  id UUID PRIMARY KEY,
  household_id UUID,
  name TEXT,
  specialty TEXT,
  practice_name TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT
);

-- medications
CREATE TABLE medications (
  id UUID PRIMARY KEY,
  family_member_id UUID REFERENCES family_members(id),
  name TEXT,
  dosage TEXT,
  frequency TEXT,
  prescriber_id UUID REFERENCES providers(id),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN
);

-- medical_documents
CREATE TABLE medical_documents (
  id UUID PRIMARY KEY,
  family_member_id UUID REFERENCES family_members(id),
  type TEXT, -- 'lab_result', 'imaging', 'prescription', 'vaccination'
  title TEXT,
  date DATE,
  provider_id UUID REFERENCES providers(id),
  file_path TEXT,
  ocr_text TEXT,
  extracted_data JSONB, -- structured data extracted from document
  embedding VECTOR(1536)
);

-- genetic_data
CREATE TABLE genetic_data (
  id UUID PRIMARY KEY,
  family_member_id UUID REFERENCES family_members(id),
  source TEXT, -- '23andme', 'ancestry'
  import_date DATE,
  raw_data_path TEXT, -- encrypted local storage
  health_markers JSONB, -- parsed health-relevant markers
  ancestry_composition JSONB
);
```

---

## Integration Design

### Search Federation Architecture

```
User Query: "When is my car insurance due?"
           |
           v
+---------------------+
|  Query Interpreter  |  (Claude API)
|  - Intent detection |
|  - Entity extraction|
+---------------------+
           |
           v
+---------------------+
|  Query Router       |
|  - Determines which |
|    apps to search   |
+---------------------+
           |
     +-----+-----+
     |           |
     v           v
+--------+  +----------+
|Finance |  |Family    |
|Search  |  |Folder    |
+--------+  +----------+
     |           |
     +-----+-----+
           |
           v
+---------------------+
|  Result Aggregator  |
|  - Rank & merge     |
|  - Generate answer  |
+---------------------+
           |
           v
"Your car insurance payment of $487 is due
 January 15th. Policy #12345 with State Farm.
 [View Document] [View Transaction History]"
```

### Cross-App Event Bus

For features like "add calendar event from Vectors task":

```typescript
// Event types
type HomebaseEvent =
  | { type: 'TASK_COMPLETED'; payload: Task }
  | { type: 'EVENT_CREATED'; payload: CalendarEvent }
  | { type: 'DOCUMENT_UPLOADED'; payload: Document }
  | { type: 'TRANSACTION_IMPORTED'; payload: Transaction }
  | { type: 'MEDICATION_REMINDER'; payload: Medication };

// Apps subscribe to events they care about
// Calendar subscribes to TASK_COMPLETED to offer "add to calendar"
// Finance subscribes to DOCUMENT_UPLOADED to detect receipts
```

---

## Success Metrics

### Milestone 1 (Vectors Polish)
- [ ] Wife has Vectors installed
- [ ] Wife adds tasks without prompting
- [ ] Trello opens < 1x per week
- [ ] "It feels nice to use" feedback

### Milestone 2 (Calendar)
- [ ] Both calendars visible in one view
- [ ] Created event appears in Google/Outlook within 1 minute
- [ ] "Are we free Saturday?" answerable in < 10 seconds

### Milestone 3 (Family Folder)
- [ ] 20+ important documents uploaded
- [ ] "Where is X?" query returns correct document
- [ ] QR codes on 5+ storage containers

### Milestone 4 (Finance)
- [ ] Bank accounts connected
- [ ] 90%+ transactions auto-categorized correctly
- [ ] Monthly export used for financial review
- [ ] Monarch subscription cancelled

### Milestone 5 (Medical)
- [ ] All family members have profiles
- [ ] Doctor contact info accessible in < 30 seconds
- [ ] 23andMe data imported and queryable
- [ ] "What medications is [name] taking?" returns correct answer

### Milestone 6 (Integration)
- [ ] Single app launch point for all Homebase
- [ ] Complex cross-app queries work
- [ ] "This feels like one product" feedback

---

## Appendix: Quick Wins (Parallel Development)

These can be built alongside main milestones when you want variety:

### QR Storage Manager
- Print QR codes for storage boxes
- Scan to see/edit contents
- Integrates with Family Folder search

### Location-Based Reminders
- Geofenced task triggers
- "Remind me at Home Depot" functionality
- Integrates with Vectors

### Recipe & Grocery
- Photo analysis of pantry
- Recipe suggestions from ingredients
- Smart grocery list
- Integrates with Finance (grocery budget)

---

## Next Steps

1. **Immediate:** Begin Vectors UI/UX overhaul
   - Create design system (colors, typography, components)
   - Prototype new list view
   - Implement card detail popup

2. **This Week:** Get wife on TestFlight
   - Clean up onboarding flow
   - Send invite
   - Gather initial feedback

3. **Ongoing:** Use Claude Code for rapid iteration
   - This development plan is your north star
   - Each session: pick a task from current milestone
   - Update this doc as decisions evolve

---

*Last Updated: January 2026*
*Version: 1.0*
