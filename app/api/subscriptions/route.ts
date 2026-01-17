import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { calculateROIScore, getStatusFromScore } from "@/lib/scoring"

const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  monthlyCost: z.number().positive(),
  usageFrequency: z.enum(["daily", "weekly", "monthly", "rare"]),
  importance: z.enum(["low", "medium", "high"]),
})

export async function GET() {
  try {
    const user = await requireUser()

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(subscriptions)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch subscriptions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()

    const body = await request.json()
    const validation = createSubscriptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, category, monthlyCost, usageFrequency, importance } = validation.data

    // Check for duplicate name
    const existing = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        name: { equals: name, mode: "insensitive" },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A subscription with this name already exists" },
        { status: 409 }
      )
    }

    // Calculate ROI score and status (now category-aware)
    const roiScore = calculateROIScore(usageFrequency, importance, monthlyCost, category)
    const status = getStatusFromScore(roiScore)

    const subscription = await prisma.subscription.create({
      data: {
        name,
        category,
        monthlyCost,
        usageFrequency,
        importance,
        roiScore,
        status,
        userId: user.id,
      },
    })

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to create subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
