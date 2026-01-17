import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { calculateROIScore, getStatusFromScore } from "@/lib/scoring"

// Demo subscriptions to reset to
const demoSubscriptions = [
  {
    name: "Slack",
    category: "Communication",
    monthlyCost: 12.5,
    usageFrequency: "daily",
    importance: "high",
  },
  {
    name: "Notion",
    category: "Productivity",
    monthlyCost: 10,
    usageFrequency: "daily",
    importance: "high",
  },
  {
    name: "Canva Pro",
    category: "Design",
    monthlyCost: 14.99,
    usageFrequency: "weekly",
    importance: "medium",
  },
  {
    name: "Adobe Creative Cloud",
    category: "Design",
    monthlyCost: 59.99,
    usageFrequency: "monthly",
    importance: "low",
  },
  {
    name: "Zoom Pro",
    category: "Communication",
    monthlyCost: 15.99,
    usageFrequency: "weekly",
    importance: "high",
  },
  {
    name: "Grammarly",
    category: "Writing",
    monthlyCost: 12,
    usageFrequency: "daily",
    importance: "medium",
  },
  {
    name: "LastPass",
    category: "Security",
    monthlyCost: 4,
    usageFrequency: "daily",
    importance: "high",
  },
  {
    name: "Coursera Plus",
    category: "Education",
    monthlyCost: 49,
    usageFrequency: "rare",
    importance: "low",
  },
]

export async function POST() {
  try {
    const user = await requireUser()

    // Delete all existing subscriptions for this user
    await prisma.subscription.deleteMany({
      where: { userId: user.id },
    })

    // Create demo subscriptions
    const subscriptionsWithScores = demoSubscriptions.map((sub) => {
      const roiScore = calculateROIScore(
        sub.usageFrequency as "daily" | "weekly" | "monthly" | "rare",
        sub.importance as "low" | "medium" | "high",
        sub.monthlyCost
      )
      const status = getStatusFromScore(roiScore)

      return {
        ...sub,
        roiScore,
        status,
        userId: user.id,
      }
    })

    await prisma.subscription.createMany({
      data: subscriptionsWithScores,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to reset subscriptions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
