import { format, subMonths, startOfMonth, isBefore, isAfter } from "date-fns"
import { prisma } from "@/lib/prisma"
import type { Subscription as PrismaSubscription } from "@prisma/client"

/**
 * Get the month key (YYYY-MM) for a date
 */
export function getMonthKey(date: Date = new Date()): string {
  return format(date, "yyyy-MM")
}

/**
 * Capture a snapshot of a subscription's current state for the current month
 * Uses upsert to avoid duplicates for the same month
 */
export async function captureSnapshot(
  subscription: PrismaSubscription,
  userId: string
): Promise<void> {
  const snapshotMonth = getMonthKey()

  await prisma.subscriptionSnapshot.upsert({
    where: {
      subscriptionId_snapshotMonth: {
        subscriptionId: subscription.id,
        snapshotMonth,
      },
    },
    update: {
      monthlyCost: subscription.monthlyCost,
      roiScore: subscription.roiScore,
      status: subscription.status,
      category: subscription.category,
    },
    create: {
      subscriptionId: subscription.id,
      snapshotMonth,
      monthlyCost: subscription.monthlyCost,
      roiScore: subscription.roiScore,
      status: subscription.status,
      category: subscription.category,
      userId,
    },
  })
}

/**
 * Capture snapshots for all subscriptions for a user for the current month
 */
export async function captureAllUserSnapshots(userId: string): Promise<number> {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
  })

  let count = 0
  for (const subscription of subscriptions) {
    await captureSnapshot(subscription, userId)
    count++
  }

  return count
}

/**
 * Backfill historical snapshots for a subscription from its createdAt date to now
 * Creates one snapshot per month the subscription existed
 */
export async function backfillSubscriptionSnapshots(
  subscription: PrismaSubscription,
  userId: string
): Promise<number> {
  const now = new Date()
  const startDate = startOfMonth(subscription.createdAt)
  const endDate = startOfMonth(now)

  let count = 0
  let currentDate = startDate

  while (isBefore(currentDate, endDate) || format(currentDate, "yyyy-MM") === format(endDate, "yyyy-MM")) {
    const snapshotMonth = getMonthKey(currentDate)

    // Check if snapshot already exists
    const existing = await prisma.subscriptionSnapshot.findUnique({
      where: {
        subscriptionId_snapshotMonth: {
          subscriptionId: subscription.id,
          snapshotMonth,
        },
      },
    })

    if (!existing) {
      await prisma.subscriptionSnapshot.create({
        data: {
          subscriptionId: subscription.id,
          snapshotMonth,
          monthlyCost: subscription.monthlyCost,
          roiScore: subscription.roiScore,
          status: subscription.status,
          category: subscription.category,
          userId,
        },
      })
      count++
    }

    // Move to next month
    currentDate = subMonths(currentDate, -1)

    // Safety check to prevent infinite loops
    if (isAfter(currentDate, subMonths(now, -1))) {
      break
    }
  }

  return count
}

/**
 * Backfill all historical snapshots for a user's subscriptions
 */
export async function backfillAllUserSnapshots(userId: string): Promise<number> {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
  })

  let totalCount = 0
  for (const subscription of subscriptions) {
    const count = await backfillSubscriptionSnapshots(subscription, userId)
    totalCount += count
  }

  return totalCount
}

/**
 * Get snapshots for a user grouped by month
 */
export async function getSnapshotsByMonth(
  userId: string,
  months: number = 6
) {
  const now = new Date()
  const startMonth = getMonthKey(subMonths(now, months - 1))

  const snapshots = await prisma.subscriptionSnapshot.findMany({
    where: {
      userId,
      snapshotMonth: {
        gte: startMonth,
      },
    },
    orderBy: {
      snapshotMonth: "asc",
    },
  })

  const byMonth = new Map<string, typeof snapshots>()
  for (const snapshot of snapshots) {
    const existing = byMonth.get(snapshot.snapshotMonth) ?? []
    existing.push(snapshot)
    byMonth.set(snapshot.snapshotMonth, existing)
  }

  return byMonth
}
