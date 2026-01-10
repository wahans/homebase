# Homebase Project Brief
*For Claude Code Onboarding*

---

## Executive Summary

**Homebase** is a comprehensive family operating system - a unified platform that integrates multiple standalone apps into one seamless interface for managing family life. The vision is to replace fragmented tools (Trello, Monarch Money, Google Calendar, various document storage) with purpose-built, privacy-first apps that work together.

**Current Status:** MVP of Vectors (the first app) is complete. Ready to expand.

**Project Location:** `/Users/wallyhansen/Desktop/projects/personal/riverside co/homebase`

---

## The Four Cornerstones

Homebase is built on four foundational "cornerstone" apps. Each works standalone but integrates into the unified Homebase platform.

### 1. Finance Cornerstone (Spend Tracking + Budgeting)
**Replaces:** Monarch Money, Copilot, YNAB, Empower/Tilt

**Core Features:**
- Bank/credit card integration (likely Plaid API)
- Automatic transaction import to unified ledger
- Smart auto-categorization (dining, gas, utilities, shopping)
- Category editing that persists (edit retailer once, always recategorized)
- Robust export functionality (Excel/CSV for custom analysis)
- Budget tracking and alerts
- Multi-user (husband + wife shared view)

**Historical Context:** User previously used Empower (now Tilt) and valued the auto-categorization with manual override and export functionality for quarterly financial reviews.

**Integration Points:**
- Calendar: Recurring payment reminders
- Family Folder: Financial document storage
- Vectors: Budget-aware task prioritization
- Recipe app: Grocery budget tracking

---

### 2. Calendar Cornerstone (Family Calendar Aggregation)
**Problem Being Solved:** User and wife use work calendars (Google Cal + Outlook) as personal calendars. They share events with each other for family stuff but managing separate personal calendars doesn't work for them.

**Core Features:**
- Multi-provider integration (Google Cal, Outlook, Apple Calendar)
- Automatic event aggregation into unified family view
- Viewable across all devices simultaneously
- Event categorization (work, family, kids, medical)
- Conflict detection
- Read-only work events, editable family events
- Mobile widgets

**Integration Points:**
- Medical app: Appointment tracking
- Vectors: Task scheduling
- Kids learning app: Event-specific modules (e.g., Disneyland trip prep)
- Spend tracking: Payment reminders
- Family Folder: Deadline tracking

---

### 3. Medical Cornerstone (Family Medical App)
**Core Concept:** Comprehensive family medical information hub that goes beyond storage to become an intelligent health advisor.

**Core Features:**
- Medical history for each family member
- Doctor/hospital directory with contact info
- Medication tracking and reminders
- Insurance information storage
- DNA/genetic data integration (23andMe, Ancestry)
- Health risk identification from genetic data
- Diet recommendations based on genetics + medical history
- Vaccination records, allergy tracking
- Medical document storage (test results, imaging, prescriptions)

**The Vision:** Not just a repository - proactive health advisor. Example: "Your genetics show higher risk for heart disease, your recent bloodwork shows elevated cholesterol - consider reducing red meat intake."

**Inspiration:** https://x.com/skirano/status/2007540021536993712

**Privacy Critical:** Medical data is ultra-sensitive. Local-first storage, encryption, HIPAA-adjacent considerations.

**Integration Points:**
- Calendar: Medical appointments
- Family Folder: Medical documents
- Recipe app: Diet-based meal planning
- Spend tracking: Medical expense tracking

---

### 4. Search Cornerstone (Family Folder / Powerful Search)
**Core Concept:** THE SECRET SAUCE. Powerfully searchable engine for important family documents AND all Homebase data. Not just "find the doc" but "answer questions about the docs."

**Example Queries to Support:**
- "When is my next car insurance payment due?" → searches spend tracker + insurance docs
- "What is covered by my home insurance?" → parses insurance policy PDF
- "Who is my daughter's dentist and when is her next appointment?" → medical app + calendar
- "Where did I store my birth certificate?" → QR code storage system

**Core Features:**
- Document storage (marriage cert, SSN cards, car titles, insurance, medical records)
- OCR and full-text search
- Natural language queries
- Cross-platform search (searches ALL Homebase data)
- QR code integration for physical document location
- Document categorization
- Expiration/renewal tracking
- Version history

**Technical Architecture:** Essentially building a personal Google for Homebase data. Vector database for semantic search, Claude API for natural language understanding.

**Privacy:** Local-first or self-hosted critical. User doesn't want Google/Dropbox having this data.

---

## Vectors (First App - MVP Complete)

**Name Origin:** "Vectors" is what the user and wife call their responsibility splits (e.g., user handles cars, wife handles laundry, user does dishes, wife owns grocery shopping).

**Problem Being Solved:** Currently using Trello to manage household chores/to-dos, but Trello is overkill for simple household management.

**Core Features:**
- Shared to-do lists with partner
- Easy mobile updates (voice input, quick add)
- Smart reminders (time-based, location-based)
- Simple assignment (me/you/us)
- Recurring tasks
- Completion notifications to partner
- Dead-simple interface (no Trello complexity)
- Weekly planning view

**Key Differentiator:** Optimized for speed and couples, not project management.

**Status:** MVP is complete. Ready for iteration and expansion.

---

## Additional Homebase Apps (To Be Integrated)

### QR Code Storage Manager
- QR codes for storage boxes to see contents without opening
- Easy backend updates when items added/removed
- Extends to fridge, freezer, closets, cabinets
- Integrates with Family Folder for "where did I store X?" queries

### Recipe & Grocery List Creator
- Photo analysis of fridge/pantry/bar
- Recipe suggestions from existing ingredients
- Smart grocery list generation
- Cocktail recipe suggestions
- Integrates with Medical for diet-based recommendations

### Location-Based Reminders
- Geo-fenced task triggers
- "Remind me about the Home Depot list when I'm at Home Depot"
- Integrates with Vectors

### Password Manager (Optional Module)
- Dashlane replacement
- Local-first, no third-party storage
- Google Authenticator replacement built-in
- Could be standalone or Homebase module

---

## Technical Principles

### Privacy-First Architecture
- **Local-first storage** for sensitive data (medical, financial, passwords)
- **Self-hosted options** where possible
- **End-to-end encryption** for sync
- **Zero-knowledge architecture** for credentials
- User controls where data lives - no third-party dependencies for sensitive info

### Primary Source Philosophy (For Kids Learning App)
- All educational content based on primary sources
- No secondary/tertiary sources driving material
- No political coloring
- Facts and skills, not ideology

### Integration Philosophy
- Each app works **standalone first**
- Integration is additive, not required
- Homebase is the "glue," not the foundation
- Cross-app search (#18) is what makes it feel magical

---

## User Context

**Family Situation:**
- Married with kids (all under 5)
- Wife uses Google Calendar for work
- User uses Microsoft Outlook for work
- Currently using Trello for household task management
- Previously used Empower for finance tracking

**Technical Approach:**
- Willing to build and learn
- Values privacy and data control
- Prefers local-first when possible
- Wants to use Claude Code and Opus 4.5 for development

**Naming Preferences:**
- Clever, easily memorable
- Short (one/two words)
- Open to bold, in-your-face names
- Personal meaning is good (e.g., "Vectors" from their actual terminology)

---

## Build Strategy

**Phase 1 (Current): Vectors MVP**
- ✅ Complete
- Ready for iteration

**Phase 2: Quick Wins**
- QR Storage Manager
- Location Reminders
- These teach different tech (camera, geofencing) while providing immediate value

**Phase 3: Cornerstones**
- Build each cornerstone as standalone app
- Family Calendar (solves immediate work calendar problem)
- Spend Tracking (high daily value)
- Family Folder (enables cross-app search)
- Medical App (highest complexity, massive value)

**Phase 4: Integration**
- Build Homebase as integration layer
- Connect all standalone apps
- Unified search across everything
- Dashboard view

**Phase 5: Extended Apps**
- Kids Learning App
- Travel Agent
- Recipe App
- Other utilities

---

## Questions for Project Fleshing Out

The user wants Claude Code to thoroughly interview them to flesh out the entire Homebase project. Key areas to explore:

1. **Current Vectors MVP:**
   - What's the current tech stack?
   - What works well? What doesn't?
   - What's the data model?
   - Mobile? Web? Both?
   - How is data stored currently?

2. **Immediate Priorities:**
   - What's the next feature for Vectors?
   - Which cornerstone to build next?
   - Any blockers or dependencies?

3. **Technical Decisions:**
   - Backend choice (Supabase? Firebase? Self-hosted?)
   - Mobile framework (React Native? Flutter? Native?)
   - Hosting/deployment approach
   - Authentication strategy for family sharing

4. **Data Architecture:**
   - How should apps share data?
   - What's the sync strategy?
   - How to handle offline?
   - Database schema philosophy

5. **Integration Design:**
   - How will apps communicate?
   - What's the search architecture?
   - How to build the unified dashboard?

6. **Privacy Implementation:**
   - Which data is local-only?
   - Which data needs sync?
   - Encryption approach?

7. **Family-Specific Requirements:**
   - Wife's involvement in development/testing?
   - Kids' ages and learning needs?
   - Specific pain points to prioritize?

---

## Related High-Priority Apps (Outside Homebase)

### Twitter High-Signal Digest (#22) - HIGH PRIORITY
- Twice-daily digest from curated high-signal Twitter accounts
- AI summary + full tweet list
- Deleted tweet archiving if possible
- Challenge: Twitter API costs

### Expert Product Review Aggregator (#23)
- AI-powered product vetting across Reddit, YouTube, forums
- "Is this Instagram ad product a scam?" detection
- Comparison mode
- Can MVP with Claude + web search today

---

## Summary

Homebase is an ambitious but achievable family operating system. The architecture is clear:
1. Four cornerstones (Finance, Calendar, Medical, Search)
2. Additional utility apps that integrate
3. Homebase as the unifying layer
4. Privacy-first, local-first where it matters

Vectors MVP is complete. The user is ready to expand. The goal of this Claude Code session is to thoroughly understand the current state, user requirements, and chart the path forward for building out the full Homebase vision.
