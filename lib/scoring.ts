import type { UsageFrequency, Importance, SubscriptionStatus } from "./types"

const USAGE_WEIGHTS: Record<UsageFrequency, number> = {
  daily: 40,
  weekly: 30,
  monthly: 15,
  rare: 5,
}

const IMPORTANCE_WEIGHTS: Record<Importance, number> = {
  high: 40,
  medium: 25,
  low: 10,
}

export function calculateROIScore(usageFrequency: UsageFrequency, importance: Importance, monthlyCost: number): number {
  const usageScore = USAGE_WEIGHTS[usageFrequency]
  const importanceScore = IMPORTANCE_WEIGHTS[importance]

  // Cost penalty: higher costs reduce score
  const costPenalty = Math.min(monthlyCost / 5, 30)

  const rawScore = usageScore + importanceScore - costPenalty

  // Normalize to 0-100
  return Math.max(0, Math.min(100, Math.round(rawScore + 30)))
}

export function getStatusFromScore(score: number): SubscriptionStatus {
  if (score >= 75) return "good"
  if (score >= 40) return "review"
  return "cut"
}

export function generateCategoryBreakdown(
  usageFrequency: UsageFrequency,
  importance: Importance,
  monthlyCost: number,
): {
  usageValue: number
  costEfficiency: number
  replacementRisk: number
  cancellationFriction: number
} {
  const usageValue = USAGE_WEIGHTS[usageFrequency] * 2.5
  const costEfficiency = Math.max(0, 100 - monthlyCost * 2)
  const replacementRisk = importance === "high" ? 85 : importance === "medium" ? 55 : 25
  const cancellationFriction = importance === "high" ? 70 : importance === "medium" ? 45 : 20

  return {
    usageValue: Math.round(usageValue),
    costEfficiency: Math.round(costEfficiency),
    replacementRisk: Math.round(replacementRisk),
    cancellationFriction: Math.round(cancellationFriction),
  }
}

export function getRecommendation(score: number): "keep" | "downgrade" | "cancel" {
  if (score >= 75) return "keep"
  if (score >= 40) return "downgrade"
  return "cancel"
}
