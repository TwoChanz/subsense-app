export type UsageFrequency = "daily" | "weekly" | "monthly" | "rare"
export type Importance = "low" | "medium" | "high"
export type SubscriptionStatus = "good" | "review" | "cut"

export interface Subscription {
  id: string
  name: string
  category: string
  monthlyCost: number
  usageFrequency: UsageFrequency
  importance: Importance
  roiScore: number
  status: SubscriptionStatus
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
