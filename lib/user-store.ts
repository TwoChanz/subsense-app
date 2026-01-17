import type { UserData, UserStreakData, SavingsData, UserBadge, BadgeType } from "./types"
import { generateId } from "./constants"

const USER_DATA_KEY = "subsense-user-data"

// Badge definitions
const BADGE_DEFINITIONS: Record<BadgeType, { name: string; description: string }> = {
  first_review: { name: "First Steps", description: "Completed your first subscription review" },
  streak_7: { name: "Week Warrior", description: "Maintained a 7-week review streak" },
  streak_30: { name: "Monthly Master", description: "Maintained a 30-week review streak" },
  saved_100: { name: "Penny Pincher", description: "Saved $100 in subscription costs" },
  saved_500: { name: "Smart Saver", description: "Saved $500 in subscription costs" },
  saved_1000: { name: "Savings Champion", description: "Saved $1,000 in subscription costs" },
  cut_first: { name: "First Cut", description: "Canceled your first subscription" },
  cut_5: { name: "Spring Cleaner", description: "Canceled 5 subscriptions" },
  optimizer: { name: "ROI Optimizer", description: "Improved average ROI score by 20+" },
}

// Default user data
function createDefaultUserData(): UserData {
  return {
    id: generateId(),
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
      lastReviewDate: null,
      totalReviewsCompleted: 0,
      streakFreezeAvailable: true,
      lastStreakFreezeUsed: null,
    },
    savings: {
      totalSavedThisMonth: 0,
      totalSavedThisYear: 0,
      totalSavedAllTime: 0,
      subscriptionsCanceled: 0,
      subscriptionsDowngraded: 0,
    },
    completedActions: [],
    snoozedActions: {},
    badges: [],
    lastActiveDate: new Date(),
  }
}

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== "undefined"
}

// Load user data from localStorage
function loadFromStorage(): UserData | null {
  if (!isBrowser()) return null

  try {
    const stored = localStorage.getItem(USER_DATA_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    // Convert date strings back to Date objects
    return {
      ...parsed,
      streaks: {
        ...parsed.streaks,
        lastReviewDate: parsed.streaks.lastReviewDate ? new Date(parsed.streaks.lastReviewDate) : null,
        lastStreakFreezeUsed: parsed.streaks.lastStreakFreezeUsed ? new Date(parsed.streaks.lastStreakFreezeUsed) : null,
      },
      snoozedActions: Object.fromEntries(
        Object.entries(parsed.snoozedActions || {}).map(([k, v]) => [k, new Date(v as string)])
      ),
      badges: parsed.badges.map((b: UserBadge & { earnedAt: string }) => ({
        ...b,
        earnedAt: new Date(b.earnedAt),
      })),
      lastActiveDate: new Date(parsed.lastActiveDate),
    }
  } catch (error) {
    console.error("Failed to load user data from localStorage:", error)
    return null
  }
}

// Save user data to localStorage
function saveToStorage(data: UserData): void {
  if (!isBrowser()) return

  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save user data to localStorage:", error)
  }
}

// Initialize user data
let userData: UserData = loadFromStorage() ?? createDefaultUserData()

// If first load, save default data
if (isBrowser() && !localStorage.getItem(USER_DATA_KEY)) {
  saveToStorage(userData)
}

// Get user data
export function getUserData(): UserData {
  if (isBrowser()) {
    const stored = loadFromStorage()
    if (stored) {
      userData = stored
    }
  }
  return { ...userData }
}

// Update streak on review completion
export function recordReviewCompletion(): UserData {
  const now = new Date()
  const lastReview = userData.streaks.lastReviewDate

  // Check if this is a new week (reviews are weekly)
  const isNewWeek = !lastReview || isMoreThanOneWeekAgo(lastReview)
  const isWithinGracePeriod = lastReview && !isMoreThanTwoWeeksAgo(lastReview)

  if (isNewWeek) {
    if (isWithinGracePeriod || !lastReview) {
      // Continue or start streak
      userData.streaks.currentStreak += 1
      if (userData.streaks.currentStreak > userData.streaks.longestStreak) {
        userData.streaks.longestStreak = userData.streaks.currentStreak
      }
    } else if (userData.streaks.streakFreezeAvailable) {
      // Use streak freeze
      userData.streaks.streakFreezeAvailable = false
      userData.streaks.lastStreakFreezeUsed = now
    } else {
      // Reset streak
      userData.streaks.currentStreak = 1
    }

    userData.streaks.lastReviewDate = now
    userData.streaks.totalReviewsCompleted += 1

    // Check for streak badges
    checkAndAwardBadge("first_review")
    if (userData.streaks.currentStreak >= 7) checkAndAwardBadge("streak_7")
    if (userData.streaks.currentStreak >= 30) checkAndAwardBadge("streak_30")
  }

  userData.lastActiveDate = now
  saveToStorage(userData)
  return { ...userData }
}

// Record savings from cancellation or downgrade
export function recordSavings(monthlySavings: number, type: "cancel" | "downgrade"): UserData {
  const annualSavings = monthlySavings * 12

  userData.savings.totalSavedThisMonth += monthlySavings
  userData.savings.totalSavedThisYear += annualSavings
  userData.savings.totalSavedAllTime += annualSavings

  if (type === "cancel") {
    userData.savings.subscriptionsCanceled += 1
    checkAndAwardBadge("cut_first")
    if (userData.savings.subscriptionsCanceled >= 5) checkAndAwardBadge("cut_5")
  } else {
    userData.savings.subscriptionsDowngraded += 1
  }

  // Check savings badges
  if (userData.savings.totalSavedAllTime >= 100) checkAndAwardBadge("saved_100")
  if (userData.savings.totalSavedAllTime >= 500) checkAndAwardBadge("saved_500")
  if (userData.savings.totalSavedAllTime >= 1000) checkAndAwardBadge("saved_1000")

  saveToStorage(userData)
  return { ...userData }
}

// Mark action as completed
export function completeAction(actionId: string): UserData {
  if (!userData.completedActions.includes(actionId)) {
    userData.completedActions.push(actionId)
    saveToStorage(userData)
  }
  return { ...userData }
}

// Snooze an action
export function snoozeAction(actionId: string, until: Date): UserData {
  userData.snoozedActions[actionId] = until
  saveToStorage(userData)
  return { ...userData }
}

// Remove snooze from action
export function unsnoozeAction(actionId: string): UserData {
  delete userData.snoozedActions[actionId]
  saveToStorage(userData)
  return { ...userData }
}

// Check if action is snoozed
export function isActionSnoozed(actionId: string): boolean {
  const snoozedUntil = userData.snoozedActions[actionId]
  if (!snoozedUntil) return false
  return new Date() < new Date(snoozedUntil)
}

// Reset monthly savings (call at start of new month)
export function resetMonthlySavings(): UserData {
  userData.savings.totalSavedThisMonth = 0
  saveToStorage(userData)
  return { ...userData }
}

// Reset yearly savings (call at start of new year)
export function resetYearlySavings(): UserData {
  userData.savings.totalSavedThisYear = 0
  saveToStorage(userData)
  return { ...userData }
}

// Award a badge if not already earned
function checkAndAwardBadge(type: BadgeType): void {
  if (userData.badges.some(b => b.type === type)) return

  const def = BADGE_DEFINITIONS[type]
  userData.badges.push({
    type,
    earnedAt: new Date(),
    name: def.name,
    description: def.description,
  })
}

// Use streak freeze (for Pro users)
export function useStreakFreeze(): boolean {
  if (!userData.streaks.streakFreezeAvailable) return false

  userData.streaks.streakFreezeAvailable = false
  userData.streaks.lastStreakFreezeUsed = new Date()
  saveToStorage(userData)
  return true
}

// Restore streak freeze (monthly reset for Pro users)
export function restoreStreakFreeze(): void {
  userData.streaks.streakFreezeAvailable = true
  saveToStorage(userData)
}

// Get streak status
export function getStreakStatus(): {
  current: number
  isAtRisk: boolean
  daysUntilExpiry: number | null
} {
  const lastReview = userData.streaks.lastReviewDate
  if (!lastReview) {
    return { current: 0, isAtRisk: false, daysUntilExpiry: null }
  }

  const now = new Date()
  const daysSinceReview = Math.floor((now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24))
  const daysUntilExpiry = 14 - daysSinceReview // 2 week grace period

  return {
    current: userData.streaks.currentStreak,
    isAtRisk: daysSinceReview > 7 && daysSinceReview <= 14,
    daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : null,
  }
}

// Helper: check if date is more than one week ago
function isMoreThanOneWeekAgo(date: Date): boolean {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return date < weekAgo
}

// Helper: check if date is more than two weeks ago
function isMoreThanTwoWeeksAgo(date: Date): boolean {
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  return date < twoWeeksAgo
}

// Reset all user data (for testing)
export function resetUserData(): void {
  userData = createDefaultUserData()
  saveToStorage(userData)
}

// Get badge definitions for display
export function getBadgeDefinitions(): typeof BADGE_DEFINITIONS {
  return BADGE_DEFINITIONS
}
