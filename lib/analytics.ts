import { format, subMonths, startOfMonth, isSameMonth } from "date-fns"
import type { Subscription, SubscriptionStatus } from "./types"

// Category colors for consistent chart styling
export const CATEGORY_COLORS: Record<string, string> = {
  Development: "#3b82f6",
  Productivity: "#8b5cf6",
  Business: "#06b6d4",
  Communication: "#10b981",
  Design: "#f59e0b",
  Entertainment: "#ef4444",
  Finance: "#14b8a6",
  Security: "#6366f1",
  Education: "#ec4899",
  Marketing: "#f97316",
  Writing: "#84cc16",
  Other: "#6b7280",
}

// Status colors for ROI charts
export const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  good: "#22c55e",
  review: "#f59e0b",
  cut: "#ef4444",
}

// Types for chart data
export interface CategoryDataPoint {
  category: string
  value: number
  percentage: number
  count: number
  color: string
}

export interface SpendingDataPoint {
  month: string
  monthKey: string
  amount: number
}

export interface ROIDataPoint {
  month: string
  monthKey: string
  good: number
  review: number
  cut: number
}

export interface ComparisonData {
  totalSpend: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
  subscriptionCount: {
    current: number
    previous: number
    change: number
  }
  averageROI: {
    current: number
    previous: number
    change: number
  }
  healthyPercent: {
    current: number
    previous: number
    change: number
  }
}

export interface AnalyticsSummary {
  spending: SpendingDataPoint[]
  categories: CategoryDataPoint[]
  roiTrend: ROIDataPoint[]
  comparison: ComparisonData
  insights: Insight[]
}

export interface Insight {
  type: "positive" | "negative" | "neutral"
  message: string
}

/**
 * Get the month key (YYYY-MM) for a date
 */
export function getMonthKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM")
}

/**
 * Calculate category breakdown from subscriptions
 */
export function calculateCategoryBreakdown(
  subscriptions: Subscription[]
): CategoryDataPoint[] {
  const categoryMap = new Map<string, { total: number; count: number }>()

  // Sum costs by category
  for (const sub of subscriptions) {
    const existing = categoryMap.get(sub.category) ?? { total: 0, count: 0 }
    categoryMap.set(sub.category, {
      total: existing.total + sub.monthlyCost,
      count: existing.count + 1,
    })
  }

  const totalSpend = subscriptions.reduce((sum, s) => sum + s.monthlyCost, 0)

  // Convert to array and calculate percentages
  const result: CategoryDataPoint[] = []
  for (const [category, data] of categoryMap.entries()) {
    result.push({
      category,
      value: Math.round(data.total * 100) / 100,
      percentage:
        totalSpend > 0 ? Math.round((data.total / totalSpend) * 1000) / 10 : 0,
      count: data.count,
      color: CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other,
    })
  }

  // Sort by value descending
  return result.sort((a, b) => b.value - a.value)
}

/**
 * Calculate spending by month for the last N months
 * Uses subscription createdAt dates to simulate historical data
 */
export function calculateSpendingByMonth(
  subscriptions: Subscription[],
  months: number = 6
): SpendingDataPoint[] {
  const result: SpendingDataPoint[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const monthStart = startOfMonth(monthDate)
    const monthKey = getMonthKey(monthDate)

    // Sum costs of subscriptions that existed in this month
    let monthlyTotal = 0
    for (const sub of subscriptions) {
      // Subscription existed if it was created before or during this month
      if (sub.createdAt <= monthStart || isSameMonth(sub.createdAt, monthDate)) {
        monthlyTotal += sub.monthlyCost
      }
    }

    result.push({
      month: format(monthDate, "MMM"),
      monthKey,
      amount: Math.round(monthlyTotal * 100) / 100,
    })
  }

  return result
}

/**
 * Calculate ROI trend by month showing subscription health distribution
 */
export function calculateROITrend(
  subscriptions: Subscription[],
  months: number = 6
): ROIDataPoint[] {
  const result: ROIDataPoint[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const monthStart = startOfMonth(monthDate)
    const monthKey = getMonthKey(monthDate)

    // Count subscriptions by status for this month
    let good = 0
    let review = 0
    let cut = 0

    for (const sub of subscriptions) {
      // Subscription existed if it was created before or during this month
      if (sub.createdAt <= monthStart || isSameMonth(sub.createdAt, monthDate)) {
        switch (sub.status) {
          case "good":
            good++
            break
          case "review":
            review++
            break
          case "cut":
            cut++
            break
        }
      }
    }

    result.push({
      month: format(monthDate, "MMM"),
      monthKey,
      good,
      review,
      cut,
    })
  }

  return result
}

/**
 * Calculate month-over-month comparison metrics
 */
export function calculateComparison(
  currentSubscriptions: Subscription[],
  previousSubscriptions: Subscription[] = []
): ComparisonData {
  // Current month metrics
  const currentSpend = currentSubscriptions.reduce(
    (sum, s) => sum + s.monthlyCost,
    0
  )
  const currentCount = currentSubscriptions.length
  const currentAvgROI =
    currentCount > 0
      ? Math.round(
          currentSubscriptions.reduce((sum, s) => sum + s.roiScore, 0) /
            currentCount
        )
      : 0
  const currentHealthy = currentSubscriptions.filter(
    (s) => s.status === "good"
  ).length
  const currentHealthyPercent =
    currentCount > 0 ? Math.round((currentHealthy / currentCount) * 100) : 0

  // Previous month metrics (if provided, otherwise simulate from current)
  const prevSubs =
    previousSubscriptions.length > 0
      ? previousSubscriptions
      : currentSubscriptions.slice(0, Math.max(0, currentSubscriptions.length - 1))
  const previousSpend = prevSubs.reduce((sum, s) => sum + s.monthlyCost, 0)
  const previousCount = prevSubs.length
  const previousAvgROI =
    previousCount > 0
      ? Math.round(prevSubs.reduce((sum, s) => sum + s.roiScore, 0) / previousCount)
      : 0
  const previousHealthy = prevSubs.filter((s) => s.status === "good").length
  const previousHealthyPercent =
    previousCount > 0 ? Math.round((previousHealthy / previousCount) * 100) : 0

  const spendChange = currentSpend - previousSpend
  const spendChangePercent =
    previousSpend > 0 ? Math.round((spendChange / previousSpend) * 100) : 0

  return {
    totalSpend: {
      current: Math.round(currentSpend * 100) / 100,
      previous: Math.round(previousSpend * 100) / 100,
      change: Math.round(spendChange * 100) / 100,
      changePercent: spendChangePercent,
    },
    subscriptionCount: {
      current: currentCount,
      previous: previousCount,
      change: currentCount - previousCount,
    },
    averageROI: {
      current: currentAvgROI,
      previous: previousAvgROI,
      change: currentAvgROI - previousAvgROI,
    },
    healthyPercent: {
      current: currentHealthyPercent,
      previous: previousHealthyPercent,
      change: currentHealthyPercent - previousHealthyPercent,
    },
  }
}

/**
 * Generate actionable insights from analytics data
 */
export function generateInsights(
  spending: SpendingDataPoint[],
  categories: CategoryDataPoint[],
  comparison: ComparisonData,
  subscriptions: Subscription[]
): Insight[] {
  const insights: Insight[] = []

  // Spending trend insight
  if (spending.length >= 2) {
    const lastMonth = spending[spending.length - 1]
    const prevMonth = spending[spending.length - 2]
    const change = lastMonth.amount - prevMonth.amount

    if (change > 0) {
      insights.push({
        type: "negative",
        message: `Spending increased $${change.toFixed(2)} from ${prevMonth.month} to ${lastMonth.month}`,
      })
    } else if (change < 0) {
      insights.push({
        type: "positive",
        message: `Spending decreased $${Math.abs(change).toFixed(2)} from ${prevMonth.month} to ${lastMonth.month}`,
      })
    }
  }

  // Category concentration insight
  if (categories.length > 0 && categories[0].percentage > 50) {
    insights.push({
      type: "neutral",
      message: `${categories[0].category} accounts for ${categories[0].percentage}% of spending`,
    })
  }

  // ROI health insight
  const cutCount = subscriptions.filter((s) => s.status === "cut").length
  if (cutCount > 0) {
    const potentialSavings = subscriptions
      .filter((s) => s.status === "cut")
      .reduce((sum, s) => sum + s.monthlyCost, 0)
    insights.push({
      type: "negative",
      message: `${cutCount} subscription${cutCount > 1 ? "s" : ""} recommended for cancellation ($${potentialSavings.toFixed(2)}/mo potential savings)`,
    })
  }

  // Healthy subscriptions insight
  if (comparison.healthyPercent.current >= 75) {
    insights.push({
      type: "positive",
      message: `${comparison.healthyPercent.current}% of subscriptions have healthy ROI scores`,
    })
  }

  // New subscriptions insight
  if (comparison.subscriptionCount.change > 0) {
    insights.push({
      type: "neutral",
      message: `Added ${comparison.subscriptionCount.change} new subscription${comparison.subscriptionCount.change > 1 ? "s" : ""} this month`,
    })
  }

  return insights
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, showSign = false): string {
  const sign = showSign && value > 0 ? "+" : ""
  return `${sign}${value}%`
}
