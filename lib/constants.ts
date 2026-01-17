// Subscription categories
export const CATEGORIES = [
  "Business",
  "Communication",
  "Design",
  "Development",
  "Education",
  "Entertainment",
  "Finance",
  "Marketing",
  "Productivity",
  "Security",
  "Writing",
  "Other",
] as const

export type Category = (typeof CATEGORIES)[number]

// Usage frequency options
export const USAGE_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "rare", label: "Rarely" },
] as const

// Importance options
export const IMPORTANCE_LEVELS = [
  { value: "high", label: "High - Essential for work" },
  { value: "medium", label: "Medium - Useful but not critical" },
  { value: "low", label: "Low - Nice to have" },
] as const

// ROI score thresholds
export const ROI_THRESHOLDS = {
  good: 75,
  review: 40,
} as const

// Generate unique ID (collision-resistant)
export function generateId(): string {
  // Use crypto.randomUUID if available, otherwise fallback to timestamp + random
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: timestamp + random string
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
