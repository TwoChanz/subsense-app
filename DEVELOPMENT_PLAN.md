# SubSense 2-Day Development Plan

## Overview

This document outlines the next 2 days of development work for SubSense, focusing on completing promised Pro features and adding high-impact functionality.

---

## Day 1: Data Visualization & Filtering

### 1. Spending Analytics Dashboard (4-5 hours)

**Goal:** Add visual insights for subscription spending patterns.

**Tasks:**
- [ ] Install Recharts: `npm install recharts`
- [ ] Create `/components/charts/spending-pie-chart.tsx` - Category breakdown
- [ ] Create `/components/charts/spending-trend-chart.tsx` - Monthly trend line
- [ ] Create `/components/charts/roi-distribution-chart.tsx` - Score distribution
- [ ] Create `/app/(dashboard)/analytics/page.tsx` - Analytics page
- [ ] Add analytics link to sidebar navigation
- [ ] Gate advanced analytics behind Pro subscription

**API Changes:**
- [ ] Add `GET /api/analytics` endpoint returning aggregated data:
  - Spending by category
  - Monthly spending history (last 6 months)
  - ROI score distribution
  - Status counts (good/review/cut)

**Components:**
```tsx
// SpendingPieChart - Shows category breakdown
// SpendingTrendChart - Monthly line chart
// ROIDistributionChart - Bar chart of score ranges
// StatusBreakdown - Good/Review/Cut counts
```

---

### 2. Advanced Filtering System (2-3 hours)

**Goal:** Enable users to quickly find and segment subscriptions.

**Tasks:**
- [ ] Create `/components/subscription-filters.tsx`
- [ ] Add filter state management with URL search params
- [ ] Implement filters:
  - Status: Good / Review / Cut (checkboxes)
  - Importance: High / Medium / Low (checkboxes)
  - Usage: Daily / Weekly / Monthly / Rare (checkboxes)
  - Cost range: Min/Max slider
  - Billing cycle: Monthly / Annual / Quarterly / Trial
  - Category: Dropdown with all categories
- [ ] Add "Clear filters" button
- [ ] Show active filter count badge
- [ ] Persist filters in URL for shareable views

**UX Considerations:**
- Filters appear above table in collapsible section
- Mobile: Full-screen filter modal
- Show result count after filtering

---

### 3. CSV Import Feature (2-3 hours)

**Goal:** Allow bulk import of existing subscriptions.

**Tasks:**
- [ ] Create `/app/(dashboard)/import/page.tsx`
- [ ] Create `/components/csv-import-wizard.tsx` with steps:
  1. Upload file
  2. Map columns to fields
  3. Preview & validate
  4. Confirm import
- [ ] Create `POST /api/subscriptions/bulk` endpoint
- [ ] Add import button to dashboard header
- [ ] Handle validation errors gracefully
- [ ] Skip duplicates with warning

**CSV Format:**
```csv
name,category,monthlyCost,usageFrequency,importance,billingCycle
Netflix,Entertainment,15.99,daily,high,monthly
Slack,Communication,12.50,daily,high,monthly
```

**Validation Rules:**
- Name: Required, max 100 chars
- Category: Must match valid category
- Cost: Positive number
- Usage/Importance: Valid enum values or empty (defaults applied)

---

## Day 2: Notifications & Pro Features

### 4. Notification System (3-4 hours)

**Goal:** Deliver proactive alerts for renewals and trials.

**Database Changes:**
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // trial_expiring, renewal_upcoming, subscription_added
  title     String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  subscriptionId String?
  subscription   Subscription? @relation(fields: [subscriptionId], references: [id])
}
```

**Tasks:**
- [ ] Add Notification model to Prisma schema
- [ ] Create `/components/notification-center.tsx` (bell icon dropdown)
- [ ] Create `/api/notifications` endpoints (GET, PATCH for mark read)
- [ ] Create `/lib/notification-generator.ts` for scheduled checks
- [ ] Implement browser push notification permission flow
- [ ] Add notification badge to header showing unread count
- [ ] Create notification types:
  - `trial_expiring`: X days until trial ends
  - `renewal_upcoming`: 7 days before renewal date
  - `subscription_added`: Confirmation of new subscription

**Notification Generation Logic:**
```ts
// Run on page load or via cron
async function generateNotifications(userId: string) {
  // Check for expiring trials
  const expiringTrials = await prisma.subscription.findMany({
    where: {
      userId,
      billingCycle: 'trial',
      trialEndDate: {
        gte: new Date(),
        lte: addDays(new Date(), 7)
      }
    }
  });
  // Create notifications for each
}
```

---

### 5. Email Reports Setup (2-3 hours)

**Goal:** Send weekly subscription summary emails to Pro users.

**Tasks:**
- [ ] Install Resend: `npm install resend`
- [ ] Create `/lib/email.ts` for email service
- [ ] Create `/emails/weekly-report.tsx` using React Email
- [ ] Create `POST /api/email/weekly-report` endpoint
- [ ] Wire up settings page `emailReports` toggle
- [ ] Add email verification flow for report email address
- [ ] Create cron job setup documentation (Vercel Cron)

**Email Template Content:**
- Total monthly spend
- Subscriptions renewing this week
- Top 3 optimization opportunities (lowest ROI)
- Potential savings summary
- Quick link to dashboard

**Cron Configuration (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/cron/weekly-report",
    "schedule": "0 9 * * 1"
  }]
}
```

---

### 6. Subscription Comparison View (2-3 hours)

**Goal:** Compare multiple subscriptions side-by-side.

**Tasks:**
- [ ] Add selection checkboxes to subscription table
- [ ] Create `/components/subscription-comparison.tsx`
- [ ] Create comparison modal with side-by-side layout
- [ ] Display comparative metrics:
  - ROI Score (with delta)
  - Monthly cost
  - Cost per user (for team/family)
  - Usage frequency
  - Importance level
  - Status recommendation
- [ ] Highlight best/worst values in each row
- [ ] Add "Compare Selected" button (enabled when 2-4 selected)
- [ ] Allow removing items from comparison

---

### 7. Quick Wins & Polish (1-2 hours)

**Spending Goal Tracker:**
- [ ] Add `monthlyBudget` field to UserSettings
- [ ] Create budget progress bar on dashboard
- [ ] Show warning when over budget

**Duplicate Detection:**
- [ ] Add duplicate warning on subscription form
- [ ] Check for similar names (fuzzy match)
- [ ] Show existing subscriptions with similar names

**Potential Savings Display:**
- [ ] Calculate total potential savings (sum of "cut" status costs)
- [ ] Add "Potential Savings" KPI card to dashboard
- [ ] Show breakdown by subscription

**Keyboard Shortcuts:**
- [ ] `n` - New subscription
- [ ] `/` - Focus search
- [ ] `?` - Show shortcuts modal

---

## Technical Notes

### New Dependencies
```bash
npm install recharts resend @react-email/components
```

### New API Routes
```
GET  /api/analytics          - Aggregated analytics data
POST /api/subscriptions/bulk - Bulk import subscriptions
GET  /api/notifications      - List user notifications
PATCH /api/notifications/:id - Mark notification as read
POST /api/email/weekly-report - Send weekly report email
POST /api/cron/weekly-report  - Cron trigger for weekly emails
```

### Database Migrations
```bash
# After adding Notification model
npx prisma db push
```

---

## Priority Matrix

| Feature | User Value | Effort | Priority |
|---------|-----------|--------|----------|
| Spending Charts | High | Medium | P1 |
| Advanced Filters | High | Low | P1 |
| CSV Import | High | Medium | P1 |
| Notifications | High | Medium | P1 |
| Email Reports | Medium | Medium | P2 |
| Comparison View | Medium | Low | P2 |
| Quick Wins | Low | Low | P3 |

---

## Success Metrics

After completing this plan:
- [ ] Users can visualize their spending patterns
- [ ] Users can filter and find subscriptions quickly
- [ ] Users can bulk import existing subscriptions
- [ ] Users receive proactive notifications about renewals/trials
- [ ] Pro users receive weekly email summaries
- [ ] Users can compare subscriptions side-by-side

---

## Notes

- All new features should follow existing code patterns
- Use shadcn/ui components for consistency
- Add loading skeletons for new async components
- Write TypeScript types for all new data structures
- Test on mobile viewport sizes
