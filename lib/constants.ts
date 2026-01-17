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

// Billing cycle options
export const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
  { value: "quarterly", label: "Quarterly" },
  { value: "trial", label: "Trial" },
] as const

// Cancellation friction options
export const CANCELLATION_FRICTIONS = [
  { value: "easy", label: "Easy to cancel" },
  { value: "moderate", label: "Moderate - requires support" },
  { value: "painful", label: "Painful - complex process" },
] as const

// Usage scope options
export const USAGE_SCOPES = [
  { value: "personal", label: "Just Me" },
  { value: "team", label: "Team" },
  { value: "family", label: "Family" },
] as const

// Trial reminder timing options
export const TRIAL_REMINDER_OPTIONS = [
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "7 days before" },
] as const

// Cancellation friction score mapping (for scoring algorithm)
export const CANCELLATION_FRICTION_SCORES = {
  easy: 20,
  moderate: 60,
  painful: 100,
} as const

// Usage scope assumed user counts (for cost-per-user calculations)
export const USAGE_SCOPE_USERS = {
  personal: 1,
  team: 3,    // Assumes average team of 3
  family: 2,  // Assumes average family of 2
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
