# SubSense Linear Issues

## Setup

**Project:** SubSense v1.1
**Cycle:** Sprint 1 (2 days)

**Labels:**
- `feature` - New functionality
- `enhancement` - Improvement to existing
- `frontend` - UI/component work
- `backend` - API/database work
- `pro` - Pro-tier feature

---

## Issues

### SUB-1: Spending Analytics Dashboard

**Priority:** High
**Estimate:** 5 points
**Labels:** `feature`, `frontend`, `pro`
**Cycle:** Sprint 1

#### Description
Add visual analytics for subscription spending patterns using Recharts.

#### Acceptance Criteria
- [ ] Category spending pie chart displays breakdown
- [ ] Monthly trend line chart shows last 6 months
- [ ] ROI score distribution bar chart renders correctly
- [ ] Analytics page accessible from sidebar
- [ ] Advanced charts gated behind Pro subscription
- [ ] Loading skeletons while data fetches

#### Tasks
- Install Recharts dependency
- Create `SpendingPieChart` component
- Create `SpendingTrendChart` component
- Create `ROIDistributionChart` component
- Build `/analytics` page layout
- Add sidebar navigation link
- Implement Pro feature gate

---

### SUB-2: Analytics API Endpoint

**Priority:** High
**Estimate:** 2 points
**Labels:** `feature`, `backend`
**Cycle:** Sprint 1
**Blocked by:** None
**Blocks:** SUB-1

#### Description
Create API endpoint returning aggregated analytics data.

#### Acceptance Criteria
- [ ] `GET /api/analytics` returns spending by category
- [ ] Returns monthly spending history (6 months)
- [ ] Returns ROI score distribution buckets
- [ ] Returns status counts (good/review/cut)
- [ ] Proper error handling and auth check

#### Tasks
- Create `/api/analytics/route.ts`
- Implement category aggregation query
- Implement monthly trend calculation
- Add ROI distribution bucketing
- Add response typing

---

### SUB-3: Advanced Subscription Filters

**Priority:** High
**Estimate:** 3 points
**Labels:** `feature`, `frontend`
**Cycle:** Sprint 1

#### Description
Enable filtering subscriptions by multiple criteria with URL persistence.

#### Acceptance Criteria
- [ ] Filter by status (Good/Review/Cut)
- [ ] Filter by importance (High/Medium/Low)
- [ ] Filter by usage frequency
- [ ] Filter by cost range (min/max slider)
- [ ] Filter by billing cycle
- [ ] Filter by category
- [ ] Filters persist in URL params
- [ ] Clear all filters button works
- [ ] Active filter count badge displays
- [ ] Mobile: filters in modal/drawer

#### Tasks
- Create `SubscriptionFilters` component
- Implement URL search param sync
- Add filter UI controls
- Integrate with subscription table
- Add mobile filter drawer
- Show filtered result count

---

### SUB-4: CSV Import Wizard

**Priority:** High
**Estimate:** 3 points
**Labels:** `feature`, `frontend`
**Cycle:** Sprint 1

#### Description
Multi-step wizard for bulk importing subscriptions from CSV.

#### Acceptance Criteria
- [ ] File upload with drag-and-drop
- [ ] Column mapping interface
- [ ] Preview table with validation errors highlighted
- [ ] Duplicate detection with skip option
- [ ] Success summary with import count
- [ ] Sample CSV download available

#### Tasks
- Create `/import` page
- Build `CSVImportWizard` component
- Implement file parsing logic
- Create column mapping step
- Build preview/validation step
- Add confirmation step
- Handle error states

---

### SUB-5: Bulk Import API

**Priority:** High
**Estimate:** 2 points
**Labels:** `feature`, `backend`
**Cycle:** Sprint 1
**Blocks:** SUB-4

#### Description
API endpoint for creating multiple subscriptions at once.

#### Acceptance Criteria
- [ ] `POST /api/subscriptions/bulk` accepts array
- [ ] Validates each subscription
- [ ] Returns success/failure per item
- [ ] Skips duplicates gracefully
- [ ] Calculates ROI scores for all
- [ ] Transaction rollback on critical failure

#### Tasks
- Create bulk endpoint
- Implement batch validation
- Add duplicate checking
- Implement partial success handling
- Add transaction wrapper

---

### SUB-6: Notification Database Model

**Priority:** High
**Estimate:** 1 point
**Labels:** `backend`
**Cycle:** Sprint 1
**Blocks:** SUB-7, SUB-8

#### Description
Add Notification model to Prisma schema.

#### Acceptance Criteria
- [ ] Notification model added to schema
- [ ] Fields: id, userId, type, title, message, read, createdAt
- [ ] Optional subscriptionId relation
- [ ] Migration runs successfully

#### Schema
```prisma
model Notification {
  id             String        @id @default(cuid())
  userId         String
  user           User          @relation(fields: [userId], references: [id])
  type           String
  title          String
  message        String
  read           Boolean       @default(false)
  createdAt      DateTime      @default(now())
  subscriptionId String?
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
}
```

---

### SUB-7: Notification Center UI

**Priority:** High
**Estimate:** 3 points
**Labels:** `feature`, `frontend`
**Cycle:** Sprint 1
**Blocked by:** SUB-6

#### Description
In-app notification center with bell icon and dropdown.

#### Acceptance Criteria
- [ ] Bell icon in header with unread badge
- [ ] Dropdown shows recent notifications
- [ ] Mark as read on click
- [ ] Mark all as read button
- [ ] Empty state when no notifications
- [ ] Links to relevant subscription
- [ ] Notification types styled differently

#### Tasks
- Create `NotificationCenter` component
- Add to app header
- Implement unread badge
- Build notification list UI
- Add mark as read functionality
- Style by notification type

---

### SUB-8: Notification API & Generator

**Priority:** High
**Estimate:** 3 points
**Labels:** `feature`, `backend`
**Cycle:** Sprint 1
**Blocked by:** SUB-6

#### Description
API endpoints and logic for generating notifications.

#### Acceptance Criteria
- [ ] `GET /api/notifications` returns user notifications
- [ ] `PATCH /api/notifications/:id` marks as read
- [ ] Generator creates trial expiring notifications
- [ ] Generator creates renewal upcoming notifications
- [ ] No duplicate notifications created
- [ ] Runs on dashboard page load

#### Tasks
- Create notifications API routes
- Build notification generator service
- Implement trial expiry check
- Implement renewal check
- Add deduplication logic
- Integrate with dashboard

---

### SUB-9: Browser Push Notifications

**Priority:** Medium
**Estimate:** 2 points
**Labels:** `feature`, `frontend`
**Cycle:** Sprint 1
**Blocked by:** SUB-8

#### Description
Request browser notification permission and send push alerts.

#### Acceptance Criteria
- [ ] Permission request flow in settings
- [ ] Push notification on trial expiring
- [ ] Push notification on renewal upcoming
- [ ] Respects user's notification toggle
- [ ] Graceful fallback if denied

#### Tasks
- Implement permission request
- Create push notification service
- Hook into notification generator
- Add settings toggle integration
- Handle permission states

---

### SUB-10: Weekly Email Reports

**Priority:** Medium
**Estimate:** 3 points
**Labels:** `feature`, `backend`, `pro`
**Cycle:** Sprint 1

#### Description
Send weekly subscription summary emails to Pro users.

#### Acceptance Criteria
- [ ] Email template with spending summary
- [ ] Lists upcoming renewals
- [ ] Shows top 3 optimization opportunities
- [ ] Calculates potential savings
- [ ] Cron job triggers weekly
- [ ] Respects email reports toggle
- [ ] Pro users only

#### Tasks
- Install Resend SDK
- Create email service wrapper
- Build weekly report template
- Create cron API endpoint
- Configure Vercel cron
- Wire up settings toggle

---

### SUB-11: Subscription Comparison View

**Priority:** Medium
**Estimate:** 2 points
**Labels:** `feature`, `frontend`
**Cycle:** Sprint 1

#### Description
Compare 2-4 subscriptions side-by-side.

#### Acceptance Criteria
- [ ] Checkboxes on subscription table rows
- [ ] "Compare Selected" button (2-4 items)
- [ ] Modal with side-by-side comparison
- [ ] Compares: ROI, cost, usage, importance, status
- [ ] Best/worst values highlighted
- [ ] Remove items from comparison

#### Tasks
- Add selection state to table
- Create `SubscriptionComparison` component
- Build comparison modal
- Implement metric comparison logic
- Add highlight styling

---

### SUB-12: Monthly Budget Tracker

**Priority:** Low
**Estimate:** 2 points
**Labels:** `enhancement`, `frontend`
**Cycle:** Sprint 1

#### Description
Set spending budget and track progress.

#### Acceptance Criteria
- [ ] Budget input in settings
- [ ] Progress bar on dashboard
- [ ] Warning state when over budget
- [ ] Percentage display

#### Tasks
- Add monthlyBudget to UserSettings
- Create budget progress component
- Add to dashboard KPIs
- Implement warning styling

---

### SUB-13: Duplicate Subscription Detection

**Priority:** Low
**Estimate:** 1 point
**Labels:** `enhancement`, `frontend`
**Cycle:** Sprint 1

#### Description
Warn users when adding similar subscriptions.

#### Acceptance Criteria
- [ ] Fuzzy match on subscription name
- [ ] Warning shown on add form
- [ ] Lists similar existing subscriptions
- [ ] Can proceed anyway

#### Tasks
- Implement fuzzy matching
- Add warning UI to form
- Show existing matches

---

### SUB-14: Keyboard Shortcuts

**Priority:** Low
**Estimate:** 1 point
**Labels:** `enhancement`, `frontend`
**Cycle:** Sprint 1

#### Description
Add keyboard shortcuts for power users.

#### Acceptance Criteria
- [ ] `n` opens new subscription
- [ ] `/` focuses search
- [ ] `?` shows shortcuts modal
- [ ] Shortcuts don't fire in inputs

#### Tasks
- Create keyboard listener
- Build shortcuts modal
- Implement navigation shortcuts

---

## CSV Import Format

For importing into Linear:

```csv
Title,Description,Priority,Estimate,Labels,Status
Spending Analytics Dashboard,Add visual analytics with Recharts,High,5,"feature,frontend,pro",Backlog
Analytics API Endpoint,Create /api/analytics endpoint,High,2,"feature,backend",Backlog
Advanced Subscription Filters,Filter by status/importance/usage/cost,High,3,"feature,frontend",Backlog
CSV Import Wizard,Multi-step bulk import wizard,High,3,"feature,frontend",Backlog
Bulk Import API,POST /api/subscriptions/bulk endpoint,High,2,"feature,backend",Backlog
Notification Database Model,Add Notification model to Prisma,High,1,backend,Backlog
Notification Center UI,Bell icon dropdown with notifications,High,3,"feature,frontend",Backlog
Notification API & Generator,API and auto-generation logic,High,3,"feature,backend",Backlog
Browser Push Notifications,Request permission and send push alerts,Medium,2,"feature,frontend",Backlog
Weekly Email Reports,Scheduled email summaries for Pro users,Medium,3,"feature,backend,pro",Backlog
Subscription Comparison View,Side-by-side subscription compare,Medium,2,"feature,frontend",Backlog
Monthly Budget Tracker,Set budget and track progress,Low,2,"enhancement,frontend",Backlog
Duplicate Subscription Detection,Warn on similar subscription names,Low,1,"enhancement,frontend",Backlog
Keyboard Shortcuts,Power user keyboard navigation,Low,1,"enhancement,frontend",Backlog
```

---

## Sprint Summary

| Priority | Issues | Total Points |
|----------|--------|--------------|
| High | 8 | 22 |
| Medium | 3 | 7 |
| Low | 3 | 4 |
| **Total** | **14** | **33** |

**Day 1 Focus:** SUB-1 through SUB-5 (Analytics + Filters + Import)
**Day 2 Focus:** SUB-6 through SUB-14 (Notifications + Pro Features + Polish)
