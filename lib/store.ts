import type { Subscription, KPIData } from "./types"
import { calculateROIScore, getStatusFromScore } from "./scoring"
import { generateId } from "./constants"

const STORAGE_KEY = "subsense-subscriptions"

// Initial demo subscriptions
const demoSubscriptions: Subscription[] = [
  {
    id: "1",
    name: "Slack",
    category: "Communication",
    monthlyCost: 12.5,
    usageFrequency: "daily",
    importance: "high",
    roiScore: 88,
    status: "good",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Notion",
    category: "Productivity",
    monthlyCost: 10,
    usageFrequency: "daily",
    importance: "high",
    roiScore: 92,
    status: "good",
    createdAt: new Date("2024-02-01"),
  },
  {
    id: "3",
    name: "Canva Pro",
    category: "Design",
    monthlyCost: 14.99,
    usageFrequency: "weekly",
    importance: "medium",
    roiScore: 58,
    status: "review",
    createdAt: new Date("2024-03-10"),
  },
  {
    id: "4",
    name: "Adobe Creative Cloud",
    category: "Design",
    monthlyCost: 59.99,
    usageFrequency: "monthly",
    importance: "low",
    roiScore: 22,
    status: "cut",
    createdAt: new Date("2023-11-20"),
  },
  {
    id: "5",
    name: "Zoom Pro",
    category: "Communication",
    monthlyCost: 15.99,
    usageFrequency: "weekly",
    importance: "high",
    roiScore: 72,
    status: "review",
    createdAt: new Date("2024-01-05"),
  },
  {
    id: "6",
    name: "Grammarly",
    category: "Writing",
    monthlyCost: 12,
    usageFrequency: "daily",
    importance: "medium",
    roiScore: 78,
    status: "good",
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "7",
    name: "LastPass",
    category: "Security",
    monthlyCost: 4,
    usageFrequency: "daily",
    importance: "high",
    roiScore: 95,
    status: "good",
    createdAt: new Date("2023-09-01"),
  },
  {
    id: "8",
    name: "Coursera Plus",
    category: "Education",
    monthlyCost: 49,
    usageFrequency: "rare",
    importance: "low",
    roiScore: 18,
    status: "cut",
    createdAt: new Date("2024-04-01"),
  },
]

// Check if we're in a browser environment
function isBrowser(): boolean {
  return typeof window !== "undefined"
}

// Load subscriptions from localStorage
function loadFromStorage(): Subscription[] | null {
  if (!isBrowser()) return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    // Convert date strings back to Date objects
    return parsed.map((sub: Subscription & { createdAt: string }) => ({
      ...sub,
      createdAt: new Date(sub.createdAt),
    }))
  } catch (error) {
    console.error("Failed to load subscriptions from localStorage:", error)
    return null
  }
}

// Save subscriptions to localStorage
function saveToStorage(subs: Subscription[]): void {
  if (!isBrowser()) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs))
  } catch (error) {
    console.error("Failed to save subscriptions to localStorage:", error)
  }
}

// Initialize subscriptions - load from storage or use demo data
let subscriptions: Subscription[] = loadFromStorage() ?? [...demoSubscriptions]

// If first load (no stored data), save demo data
if (isBrowser() && !localStorage.getItem(STORAGE_KEY)) {
  saveToStorage(subscriptions)
}

export function getSubscriptions(): Subscription[] {
  // Re-check storage in case it was updated in another tab
  if (isBrowser()) {
    const stored = loadFromStorage()
    if (stored) {
      subscriptions = stored
    }
  }
  return [...subscriptions]
}

export function getSubscriptionById(id: string): Subscription | undefined {
  return subscriptions.find((sub) => sub.id === id)
}

export function isNameDuplicate(name: string, excludeId?: string): boolean {
  const normalizedName = name.trim().toLowerCase()
  return subscriptions.some(
    (sub) => sub.name.toLowerCase() === normalizedName && sub.id !== excludeId
  )
}

export function addSubscription(data: Omit<Subscription, "id" | "roiScore" | "status" | "createdAt">): Subscription {
  const roiScore = calculateROIScore(data.usageFrequency, data.importance, data.monthlyCost)
  const status = getStatusFromScore(roiScore)

  const newSubscription: Subscription = {
    ...data,
    id: generateId(),
    roiScore,
    status,
    createdAt: new Date(),
  }

  subscriptions = [...subscriptions, newSubscription]
  saveToStorage(subscriptions)
  return newSubscription
}

export function updateSubscription(
  id: string,
  data: Partial<Omit<Subscription, "id" | "roiScore" | "status" | "createdAt">>,
): Subscription | undefined {
  const index = subscriptions.findIndex((sub) => sub.id === id)
  if (index === -1) return undefined

  const existing = subscriptions[index]
  const updated = { ...existing, ...data }

  const roiScore = calculateROIScore(updated.usageFrequency, updated.importance, updated.monthlyCost)
  const status = getStatusFromScore(roiScore)

  const updatedSubscription: Subscription = {
    ...updated,
    roiScore,
    status,
  }

  subscriptions = [...subscriptions.slice(0, index), updatedSubscription, ...subscriptions.slice(index + 1)]
  saveToStorage(subscriptions)

  return updatedSubscription
}

export function deleteSubscription(id: string): boolean {
  const initialLength = subscriptions.length
  subscriptions = subscriptions.filter((sub) => sub.id !== id)

  if (subscriptions.length < initialLength) {
    saveToStorage(subscriptions)
    return true
  }
  return false
}

export function calculateKPIs(): KPIData {
  const totalMonthlySpend = subscriptions.reduce((sum, sub) => sum + sub.monthlyCost, 0)

  const subscriptionCount = subscriptions.length

  const estimatedWaste = subscriptions
    .filter((sub) => sub.status === "cut")
    .reduce((sum, sub) => sum + sub.monthlyCost, 0)

  const optimizationOpportunities = subscriptions.filter(
    (sub) => sub.status === "review" || sub.status === "cut",
  ).length

  return {
    totalMonthlySpend,
    subscriptionCount,
    estimatedWaste,
    optimizationOpportunities,
  }
}

export function resetSubscriptions(): void {
  subscriptions = [...demoSubscriptions]
  saveToStorage(subscriptions)
}

// Clear all data (for testing or complete reset)
export function clearAllData(): void {
  subscriptions = []
  if (isBrowser()) {
    localStorage.removeItem(STORAGE_KEY)
  }
}
