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
