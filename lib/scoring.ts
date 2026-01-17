import type { UsageFrequency, Importance, SubscriptionStatus, BillingCycle, CancellationFriction, UsageScope } from "./types"
import { CANCELLATION_FRICTION_SCORES, USAGE_SCOPE_USERS } from "./constants"

/**
 * Category value multipliers - productivity/work tools have higher intrinsic value
 * These reflect the typical business/personal value a category provides
 */
const CATEGORY_VALUE_MULTIPLIERS: Record<string, number> = {
  Development: 1.4,
  Productivity: 1.3,
  Security: 1.3,
  Business: 1.25,     // Essential infrastructure (mailboxes, phones, agents)
  Communication: 1.2,
  Finance: 1.2,
  Education: 1.15,
  Design: 1.15,
  Marketing: 1.1,
  Writing: 1.1,
  Entertainment: 0.85,
  Other: 1.0,
}

/**
 * Expected cost ranges by category (monthly, in USD)
 * Used to determine if a subscription is priced fairly for its category
 */
const CATEGORY_COST_EXPECTATIONS: Record<string, { typical: number; high: number }> = {
  Development: { typical: 50, high: 200 },
  Business: { typical: 30, high: 150 },  // Virtual mailbox, phone, registered agent
  Productivity: { typical: 15, high: 50 },
  Security: { typical: 20, high: 100 },
  Communication: { typical: 12, high: 40 },
  Finance: { typical: 25, high: 100 },
  Education: { typical: 30, high: 100 },
  Design: { typical: 30, high: 100 },
  Marketing: { typical: 100, high: 500 },
  Writing: { typical: 20, high: 50 },
  Entertainment: { typical: 15, high: 35 },
  Other: { typical: 20, high: 60 },
}

/**
 * Category lock-in factor - how hard is it to switch in this category?
 * Higher = more lock-in (data, integrations, learning curve)
 */
const CATEGORY_LOCK_IN: Record<string, number> = {
  Development: 0.75,
  Business: 0.85,     // High switching cost (address changes, legal filings)
  Productivity: 0.7,
  Security: 0.8,
  Communication: 0.9, // High network effects
  Finance: 0.85,
  Education: 0.5,
  Design: 0.7,
  Marketing: 0.65,
  Writing: 0.6,
  Entertainment: 0.4, // Easy to switch
  Other: 0.6,
}

/**
 * Weight for blending primary and secondary categories
 */
const PRIMARY_CATEGORY_WEIGHT = 0.7
const SECONDARY_CATEGORY_WEIGHT = 0.3

/**
 * Base usage scores - how much value extraction potential
 */
const USAGE_BASE: Record<UsageFrequency, number> = {
  daily: 100,
  weekly: 70,
  monthly: 40,
  rare: 15,
}

/**
 * Importance multipliers - scales value based on criticality
 */
const IMPORTANCE_MULTIPLIERS: Record<Importance, number> = {
  high: 1.0,
  medium: 0.75,
  low: 0.5,
}

/**
 * Normalize cost to monthly equivalent based on billing cycle
 * Trials are treated as $0 cost since they haven't committed money yet
 */
export function normalizeToMonthlyCost(cost: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case "annual":
      return cost / 12
    case "quarterly":
      return cost / 3
    case "trial":
      return 0 // Trials don't count toward cost scoring
    default:
      return cost
  }
}

/**
 * Adjust cost per user based on usage scope
 * Shared subscriptions have lower effective cost per person
 */
export function adjustForUsageScope(monthlyCost: number, usageScope: UsageScope): number {
  const users = USAGE_SCOPE_USERS[usageScope]
  return monthlyCost / users
}

/**
 * Calculate trial urgency multiplier based on days until trial ends
 * Higher urgency = score gets modified to flag action needed
 */
export function calculateTrialUrgency(trialEndDate: Date | null | undefined): number {
  if (!trialEndDate) return 1.0
  const now = new Date()
  const daysUntilEnd = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilEnd <= 0) return 2.0    // Expired - highest urgency
  if (daysUntilEnd <= 3) return 1.5    // Very urgent
  if (daysUntilEnd <= 7) return 1.3    // Urgent
  return 1.0                            // Normal
}

/**
 * Get annualized cost for display purposes
 */
export function getAnnualizedCost(cost: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case "annual":
      return cost
    case "quarterly":
      return cost * 4
    case "monthly":
      return cost * 12
    case "trial":
      return 0
    default:
      return cost * 12
  }
}

/**
 * Get blended category values when a secondary category is present
 */
function getBlendedCategoryValues(
  primaryCategory: string,
  secondaryCategory?: string | null
): {
  valueMultiplier: number
  costExpectations: { typical: number; high: number }
  lockInFactor: number
} {
  const primaryMultiplier = CATEGORY_VALUE_MULTIPLIERS[primaryCategory] ?? 1.0
  const primaryCost = CATEGORY_COST_EXPECTATIONS[primaryCategory] ?? { typical: 20, high: 60 }
  const primaryLockIn = CATEGORY_LOCK_IN[primaryCategory] ?? 0.6

  if (!secondaryCategory) {
    return {
      valueMultiplier: primaryMultiplier,
      costExpectations: primaryCost,
      lockInFactor: primaryLockIn,
    }
  }

  const secondaryMultiplier = CATEGORY_VALUE_MULTIPLIERS[secondaryCategory] ?? 1.0
  const secondaryCost = CATEGORY_COST_EXPECTATIONS[secondaryCategory] ?? { typical: 20, high: 60 }
  const secondaryLockIn = CATEGORY_LOCK_IN[secondaryCategory] ?? 0.6

  return {
    valueMultiplier:
      primaryMultiplier * PRIMARY_CATEGORY_WEIGHT +
      secondaryMultiplier * SECONDARY_CATEGORY_WEIGHT,
    costExpectations: {
      typical:
        primaryCost.typical * PRIMARY_CATEGORY_WEIGHT +
        secondaryCost.typical * SECONDARY_CATEGORY_WEIGHT,
      high:
        primaryCost.high * PRIMARY_CATEGORY_WEIGHT +
        secondaryCost.high * SECONDARY_CATEGORY_WEIGHT,
    },
    lockInFactor:
      primaryLockIn * PRIMARY_CATEGORY_WEIGHT +
      secondaryLockIn * SECONDARY_CATEGORY_WEIGHT,
  }
}

/**
 * Calculate the final ROI score (0-100)
 *
 * The score is a weighted combination of four factors:
 * - Usage Value (40%): How much value you extract based on usage, importance, and category
 * - Cost Efficiency (35%): Value-for-money considering category expectations
 * - Replacement Risk (15%): How difficult/risky it would be to replace
 * - Cancellation Friction (10%): How much disruption canceling would cause
 *
 * Supports:
 * - Secondary category for multi-purpose subscriptions (70/30 blend)
 * - Billing cycle normalization (annual/quarterly → monthly equivalent)
 * - Usage scope cost adjustment (team/family cost sharing)
 * - User-provided cancellation friction override
 * - Trial subscription special handling
 */
export function calculateROIScore(
  usageFrequency: UsageFrequency,
  importance: Importance,
  rawCost: number,
  category: string = "Other",
  secondaryCategory?: string | null,
  billingCycle: BillingCycle = "monthly",
  usageScope: UsageScope = "personal",
  userCancellationFriction?: CancellationFriction
): number {
  // Normalize cost to monthly equivalent and adjust for usage scope
  const normalizedCost = normalizeToMonthlyCost(rawCost, billingCycle)
  const effectiveCost = adjustForUsageScope(normalizedCost, usageScope)

  const breakdown = generateCategoryBreakdown(
    usageFrequency,
    importance,
    effectiveCost,
    category,
    secondaryCategory,
    userCancellationFriction
  )

  // Weighted combination of sub-scores
  let roi =
    (breakdown.usageValue * 0.40) +
    (breakdown.costEfficiency * 0.35) +
    (breakdown.replacementRisk * 0.15) +
    (breakdown.cancellationFriction * 0.10)

  // Trial subscriptions get a reduced base score
  // They haven't proven their value yet, so we're more conservative
  if (billingCycle === "trial") {
    roi = roi * 0.75
  }

  return Math.max(0, Math.min(100, Math.round(roi)))
}

/**
 * Legacy overload for backward compatibility
 */
export function calculateROIScoreLegacy(
  usageFrequency: UsageFrequency,
  importance: Importance,
  monthlyCost: number
): number {
  return calculateROIScore(usageFrequency, importance, monthlyCost, "Other")
}

export function getStatusFromScore(score: number): SubscriptionStatus {
  if (score >= 75) return "good"
  if (score >= 40) return "review"
  return "cut"
}

/**
 * Generate detailed breakdown of ROI factors
 * Each sub-score is 0-100 and has real meaning
 *
 * Supports:
 * - Optional secondary category for blended scoring
 * - User-provided cancellation friction override
 */
export function generateCategoryBreakdown(
  usageFrequency: UsageFrequency,
  importance: Importance,
  monthlyCost: number,
  category: string = "Other",
  secondaryCategory?: string | null,
  userCancellationFriction?: CancellationFriction
): {
  usageValue: number
  costEfficiency: number
  replacementRisk: number
  cancellationFriction: number
} {
  // Get blended values if secondary category is present
  const { valueMultiplier: categoryMultiplier, costExpectations, lockInFactor } =
    getBlendedCategoryValues(category, secondaryCategory)

  const usageBase = USAGE_BASE[usageFrequency]
  const importanceMultiplier = IMPORTANCE_MULTIPLIERS[importance]

  // 1. USAGE VALUE (0-100)
  // How much value are you extracting from this subscription?
  // Factors: usage frequency, importance level, category value potential
  const rawUsageValue = usageBase * importanceMultiplier * categoryMultiplier
  const usageValue = Math.min(100, Math.round(rawUsageValue))

  // 2. COST EFFICIENCY (0-100)
  // Are you getting good value for the money spent?
  // Compares: actual cost vs category expectations, adjusted by usage
  // High usage of expensive tool = still efficient
  // Low usage of cheap tool = still inefficient

  // How expensive is this relative to category norms? (0-100 scale)
  const costPosition = Math.min(100, (monthlyCost / costExpectations.high) * 100)

  // How much value are you extracting? (0-100 scale)
  const valueExtracted = usageBase * importanceMultiplier

  // Efficiency = value extracted minus cost burden
  // If you use it a lot and it's important, high cost is justified
  const costBurden = costPosition * (1 - (valueExtracted / 150)) // Scaled burden
  const rawEfficiency = 100 - costBurden
  const costEfficiency = Math.max(0, Math.min(100, Math.round(rawEfficiency)))

  // 3. REPLACEMENT RISK (0-100)
  // How risky/difficult would it be to replace this subscription?
  // Factors: importance (how critical), category lock-in (switching costs)
  const rawReplacementRisk = importanceMultiplier * 100 * lockInFactor
  const replacementRisk = Math.round(rawReplacementRisk)

  // 4. CANCELLATION FRICTION (0-100)
  // How much disruption would canceling cause?
  // If user provided their assessment, use that; otherwise calculate
  let cancellationFriction: number
  if (userCancellationFriction) {
    // User-provided friction (easy=20, moderate=60, painful=100)
    cancellationFriction = CANCELLATION_FRICTION_SCORES[userCancellationFriction]
  } else {
    // Calculate based on importance and usage
    const importanceComponent = importanceMultiplier * 55
    const usageComponent = (usageBase / 100) * 45
    const rawFriction = importanceComponent + usageComponent
    cancellationFriction = Math.min(100, Math.round(rawFriction))
  }

  return {
    usageValue,
    costEfficiency,
    replacementRisk,
    cancellationFriction,
  }
}

export function getRecommendation(score: number): "keep" | "downgrade" | "cancel" {
  if (score >= 75) return "keep"
  if (score >= 40) return "downgrade"
  return "cancel"
}

/**
 * Get a human-readable explanation of the ROI score
 */
export function getScoreExplanation(
  usageFrequency: UsageFrequency,
  importance: Importance,
  monthlyCost: number,
  category: string = "Other",
  secondaryCategory?: string | null
): string[] {
  const breakdown = generateCategoryBreakdown(usageFrequency, importance, monthlyCost, category, secondaryCategory)
  const { costExpectations } = getBlendedCategoryValues(category, secondaryCategory)
  const explanations: string[] = []

  // Usage Value explanation
  if (breakdown.usageValue >= 80) {
    explanations.push("High value extraction from frequent, important use")
  } else if (breakdown.usageValue >= 50) {
    explanations.push("Moderate value - used regularly but room for more")
  } else {
    explanations.push("Low value extraction - underutilized for its potential")
  }

  // Cost Efficiency explanation
  const categoryLabel = secondaryCategory ? `${category}/${secondaryCategory}` : category
  if (monthlyCost > costExpectations.high) {
    explanations.push(`Premium priced for ${categoryLabel} (typical: $${Math.round(costExpectations.typical)}/mo)`)
  } else if (monthlyCost < costExpectations.typical * 0.5) {
    explanations.push("Budget-friendly for its category")
  }

  if (breakdown.costEfficiency >= 70) {
    explanations.push("Good value for money given your usage")
  } else if (breakdown.costEfficiency < 40) {
    explanations.push("Cost may not be justified by current usage")
  }

  // Replacement Risk explanation
  if (breakdown.replacementRisk >= 70) {
    explanations.push("Difficult to replace - high switching costs")
  } else if (breakdown.replacementRisk < 40) {
    explanations.push("Easy to find alternatives if needed")
  }

  return explanations
}
