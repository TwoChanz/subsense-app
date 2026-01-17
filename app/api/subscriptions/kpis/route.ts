import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireUser()

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
    })

    const totalMonthlySpend = subscriptions.reduce(
      (sum, sub) => sum + sub.monthlyCost,
      0
    )

    const subscriptionCount = subscriptions.length

    const estimatedWaste = subscriptions
      .filter((sub) => sub.status === "cut")
      .reduce((sum, sub) => sum + sub.monthlyCost, 0)

    const optimizationOpportunities = subscriptions.filter(
      (sub) => sub.status === "review" || sub.status === "cut"
    ).length

    return NextResponse.json({
      totalMonthlySpend,
      subscriptionCount,
      estimatedWaste,
      optimizationOpportunities,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch KPIs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
