import type { Subscription, KPIData } from "./types"

// API response types
interface ApiResponse<T> {
  data?: T
  error?: string
}

// Subscriptions API
// Helper to convert date strings from API to Date objects
function convertSubscriptionDates(sub: Record<string, unknown>): Subscription {
  return {
    ...sub,
    createdAt: new Date(sub.createdAt as string),
    renewalDate: sub.renewalDate ? new Date(sub.renewalDate as string) : null,
    trialEndDate: sub.trialEndDate ? new Date(sub.trialEndDate as string) : null,
  } as Subscription
}

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const res = await fetch("/api/subscriptions")
  if (!res.ok) {
    throw new Error("Failed to fetch subscriptions")
  }
  const data = await res.json()
  return data.map(convertSubscriptionDates)
}

export async function fetchSubscriptionById(id: string): Promise<Subscription | null> {
  const res = await fetch(`/api/subscriptions/${id}`)
  if (res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new Error("Failed to fetch subscription")
  }
  const data = await res.json()
  return convertSubscriptionDates(data)
}

export async function createSubscription(data: {
  name: string
  category: string
  secondaryCategory?: string | null
  monthlyCost: number
  usageFrequency: string
  importance: string
  // New fields
  billingCycle?: string
  renewalDate?: string | null
  cancellationFriction?: string
  usageScope?: string
  trialEndDate?: string | null
  trialReminderEnabled?: boolean
  trialReminderDays?: number
}): Promise<Subscription> {
  const res = await fetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to create subscription")
  }
  const result = await res.json()
  return convertSubscriptionDates(result)
}

export async function updateSubscription(
  id: string,
  data: {
    name?: string
    category?: string
    secondaryCategory?: string | null
    monthlyCost?: number
    usageFrequency?: string
    importance?: string
    // New fields
    billingCycle?: string
    renewalDate?: string | null
    cancellationFriction?: string
    usageScope?: string
    trialEndDate?: string | null
    trialReminderEnabled?: boolean
    trialReminderDays?: number
  }
): Promise<Subscription> {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to update subscription")
  }
  const result = await res.json()
  return convertSubscriptionDates(result)
}

export async function deleteSubscription(id: string): Promise<void> {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error("Failed to delete subscription")
  }
}

export async function checkDuplicateName(name: string, excludeId?: string): Promise<boolean> {
  const params = new URLSearchParams({ name })
  if (excludeId) {
    params.append("excludeId", excludeId)
  }
  const res = await fetch(`/api/subscriptions/check-duplicate?${params}`)
  if (!res.ok) {
    throw new Error("Failed to check duplicate")
  }
  const data = await res.json()
  return data.isDuplicate
}

export async function fetchKPIs(): Promise<KPIData> {
  const res = await fetch("/api/subscriptions/kpis")
  if (!res.ok) {
    throw new Error("Failed to fetch KPIs")
  }
  return res.json()
}

export async function resetSubscriptions(): Promise<void> {
  const res = await fetch("/api/subscriptions/reset", {
    method: "POST",
  })
  if (!res.ok) {
    throw new Error("Failed to reset subscriptions")
  }
}

// Settings API
export interface UserSettingsData {
  pushNotifications: boolean
  emailReports: boolean
  emailAddress: string
}

export async function fetchSettings(): Promise<UserSettingsData> {
  const res = await fetch("/api/settings")
  if (!res.ok) {
    throw new Error("Failed to fetch settings")
  }
  return res.json()
}

export async function updateSettings(data: Partial<UserSettingsData>): Promise<UserSettingsData> {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error("Failed to update settings")
  }
  return res.json()
}
