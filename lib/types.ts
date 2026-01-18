export type UsageFrequency = "daily" | "weekly" | "monthly" | "rare"
export type Importance = "low" | "medium" | "high"
export type SubscriptionStatus = "good" | "review" | "cut"

// New types for billing and subscription management
export type BillingCycle = "monthly" | "annual" | "quarterly" | "trial"
export type CancellationFriction = "easy" | "moderate" | "painful"
export type UsageScope = "personal" | "team" | "family"

export interface Subscription {
  id: string
  name: string
  category: string
  secondaryCategory?: string | null
  monthlyCost: number
  usageFrequency: UsageFrequency
  importance: Importance
  roiScore: number
  status: SubscriptionStatus
  createdAt: Date
  // Billing cycle and renewal
  billingCycle: BillingCycle
  renewalDate?: Date | null
  // Cancellation and usage scope
  cancellationFriction: CancellationFriction
  usageScope: UsageScope
  // Trial-specific fields
  trialEndDate?: Date | null
  trialReminderEnabled: boolean
  trialReminderDays: number
  // Vendor cancel-link directory
  vendorId?: string | null
  vendor?: Vendor | null
  cancelUrl?: string | null
}

// Vendor cancel-link directory types
export type VendorSource = 'curated' | 'user_submitted'
export type VendorConfidence = 'high' | 'medium' | 'low'

export interface Vendor {
  id: string
  name: string
  domain: string
  billingUrl?: string | null
  cancelHelpUrl?: string | null
  source: VendorSource
  confidence: VendorConfidence
  lastVerifiedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface VendorLinkFeedback {
  id: string
  vendorId: string
  userId: string
  action: string
  result: 'success' | 'fail' | 'skip'
  createdAt: Date
}

export interface KPIData {
  totalMonthlySpend: number
  subscriptionCount: number
  estimatedWaste: number
  optimizationOpportunities: number
}

export interface CategoryBreakdown {
  usageValue: number
  costEfficiency: number
  replacementRisk: number
  cancellationFriction: number
}

// Action Queue types
export type ActionType = "cancel" | "downgrade" | "review" | "trial_ending" | "renewal_reminder"

export interface ActionItem {
  id: string
  subscriptionId: string
  subscriptionName: string
  type: ActionType
  title: string
  description: string
  potentialSavings?: number // monthly savings
  dueDate?: Date | null
  priority: "high" | "medium" | "low"
  snoozedUntil?: Date | null
  createdAt: Date
}

// User engagement data
export interface UserStreakData {
  currentStreak: number
  longestStreak: number
  lastReviewDate: Date | null
  totalReviewsCompleted: number
  streakFreezeAvailable: boolean
  lastStreakFreezeUsed: Date | null
}

export interface SavingsData {
  totalSavedThisMonth: number
  totalSavedThisYear: number
  totalSavedAllTime: number
  subscriptionsCanceled: number
  subscriptionsDowngraded: number
}

export interface UserData {
  id: string
  streaks: UserStreakData
  savings: SavingsData
  completedActions: string[] // IDs of completed action items
  snoozedActions: Record<string, Date> // actionId -> snoozedUntil date
  badges: UserBadge[]
  lastActiveDate: Date
}

// Badge/Achievement system
export type BadgeType =
  | "first_review"
  | "streak_7"
  | "streak_30"
  | "saved_100"
  | "saved_500"
  | "saved_1000"
  | "cut_first"
  | "cut_5"
  | "optimizer"

export interface UserBadge {
  type: BadgeType
  earnedAt: Date
  name: string
  description: string
}

// Cancellation guides
export interface CancellationStep {
  stepNumber: number
  instruction: string
  link?: string
}

export interface CancellationGuide {
  serviceName: string
  difficulty: CancellationFriction
  estimatedTime: string
  steps: CancellationStep[]
  tips: string[]
  canCancelOnline: boolean
  refundPolicy?: string
}

// Weekly digest data
export interface WeeklyDigestData {
  weekStartDate: Date
  totalSpend: number
  upcomingRenewals: Array<{
    subscription: Subscription
    renewalDate: Date
    amount: number
  }>
  lowestROISubscription: Subscription | null
  actionItemsCount: number
  streakStatus: {
    current: number
    isAtRisk: boolean
  }
  savingsThisWeek: number
}

// Report types for shareable content
export interface SavingsReport {
  generatedAt: Date
  period: "monthly" | "annual"
  periodStart: Date
  periodEnd: Date
  totalSubscriptions: number
  totalMonthlySpend: number
  totalSaved: number
  subscriptionsCanceled: number
  subscriptionsDowngraded: number
  topCancelledServices: string[]
  averageROIScore: number
  healthBreakdown: {
    good: number
    review: number
    cut: number
  }
}
