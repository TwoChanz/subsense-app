import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import {
  calculateCategoryBreakdown,
  calculateSpendingByMonth,
  calculateROITrend,
  calculateComparison,
  generateInsights,
  type AnalyticsSummary,
} from "@/lib/analytics"
import type { Subscription } from "@/lib/types"

const querySchema = z.object({
  months: z.coerce.number().min(1).max(12).default(6),
})

export async function GET(request: Request) {
  try {
    const user = await requireUser()

    // Parse query params
    const { searchParams } = new URL(request.url)
    const validation = querySchema.safeParse({
      months: searchParams.get("months") ?? 6,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { months } = validation.data

    // Fetch current subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    // Convert Prisma types to our Subscription type
    const typedSubscriptions = subscriptions.map((s) => ({
      ...s,
      createdAt: s.createdAt,
      renewalDate: s.renewalDate,
      trialEndDate: s.trialEndDate,
    })) as unknown as Subscription[]

    // Calculate analytics using current subscription data
    // (Later will use snapshots for historical accuracy)
    const spending = calculateSpendingByMonth(typedSubscriptions, months)
    const categories = calculateCategoryBreakdown(typedSubscriptions)
    const roiTrend = calculateROITrend(typedSubscriptions, months)
    const comparison = calculateComparison(typedSubscriptions)
    const insights = generateInsights(spending, categories, comparison, typedSubscriptions)

    const summary: AnalyticsSummary = {
      spending,
      categories,
      roiTrend,
      comparison,
      insights,
    }

    return NextResponse.json(summary)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch analytics summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
