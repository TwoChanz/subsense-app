import type { UsageFrequency, Importance, SubscriptionStatus } from "./types"

/**
 * Category value multipliers - productivity/work tools have higher intrinsic value
 * These reflect the typical business/personal value a category provides
 */
const CATEGORY_VALUE_MULTIPLIERS: Record<string, number> = {
  Development: 1.4,
  Productivity: 1.3,
  Security: 1.3,
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
 * Calculate the final ROI score (0-100)
 *
 * The score is a weighted combination of four factors:
 * - Usage Value (40%): How much value you extract based on usage, importance, and category
 * - Cost Efficiency (35%): Value-for-money considering category expectations
 * - Replacement Risk (15%): How difficult/risky it would be to replace
 * - Cancellation Friction (10%): How much disruption canceling would cause
 */
export function calculateROIScore(
  usageFrequency: UsageFrequency,
  importance: Importance,
  monthlyCost: number,
  category: string = "Other"
): number {
  const breakdown = generateCategoryBreakdown(usageFrequency, importance, monthlyCost, category)

  // Weighted combination of sub-scores
  const roi =
    (breakdown.usageValue * 0.40) +
    (breakdown.costEfficiency * 0.35) +
    (breakdown.replacementRisk * 0.15) +
    (breakdown.cancellationFriction * 0.10)

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
 */
export function generateCategoryBreakdown(
  usageFrequency: UsageFrequency,
  importance: Importance,
  monthlyCost: number,
  category: string = "Other"
): {
  usageValue: number
  costEfficiency: number
  replacementRisk: number
  cancellationFriction: number
} {
  const categoryMultiplier = CATEGORY_VALUE_MULTIPLIERS[category] ?? 1.0
  const costExpectations = CATEGORY_COST_EXPECTATIONS[category] ?? { typical: 20, high: 60 }
  const lockInFactor = CATEGORY_LOCK_IN[category] ?? 0.6
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
  // Factors: importance (how much you'd miss it), usage (habit strength)
  const importanceComponent = importanceMultiplier * 55
  const usageComponent = (usageBase / 100) * 45
  const rawFriction = importanceComponent + usageComponent
  const cancellationFriction = Math.min(100, Math.round(rawFriction))

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
  category: string = "Other"
): string[] {
  const breakdown = generateCategoryBreakdown(usageFrequency, importance, monthlyCost, category)
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
  const costExpectations = CATEGORY_COST_EXPECTATIONS[category] ?? { typical: 20, high: 60 }
  if (monthlyCost > costExpectations.high) {
    explanations.push(`Premium priced for ${category} (typical: $${costExpectations.typical}/mo)`)
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
