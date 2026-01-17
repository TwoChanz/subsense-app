import { prisma } from "./prisma"
import { requireUser } from "./auth"

export type ProStatus = "FREE" | "ACTIVE" | "PAST_DUE" | "CANCELED"

export interface ProStatusInfo {
  isPro: boolean
  proStatus: ProStatus
  stripeCurrentPeriodEnd: Date | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

/**
 * Get the Pro status for a user by their internal user ID
 */
export async function getProStatus(userId: string): Promise<ProStatusInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      proStatus: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  })

  if (!user) {
    return {
      isPro: false,
      proStatus: "FREE",
      stripeCurrentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    }
  }

  return {
    isPro: user.isPro,
    proStatus: user.proStatus as ProStatus,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
  }
}

/**
 * Get the Pro status for the currently authenticated user
 */
export async function getCurrentUserProStatus(): Promise<ProStatusInfo> {
  const user = await requireUser()
  return getProStatus(user.id)
}

/**
 * Require the current user to be a Pro user
 * Throws an error if the user is not Pro
 */
export async function requirePro(): Promise<void> {
  const status = await getCurrentUserProStatus()

  if (!status.isPro) {
    throw new Error("This feature requires a Pro subscription")
  }

  // Also check if the subscription has expired
  if (
    status.stripeCurrentPeriodEnd &&
    new Date() > status.stripeCurrentPeriodEnd
  ) {
    throw new Error("Your Pro subscription has expired")
  }
}

/**
 * Check if a user is Pro (safe version that returns boolean)
 */
export async function isUserPro(userId: string): Promise<boolean> {
  const status = await getProStatus(userId)
  return status.isPro
}

/**
 * Check if the current user is Pro (safe version that returns boolean)
 */
export async function isCurrentUserPro(): Promise<boolean> {
  try {
    const status = await getCurrentUserProStatus()
    return status.isPro
  } catch {
    return false
  }
}
