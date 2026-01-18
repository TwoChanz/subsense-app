import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { calculateROIScore, getStatusFromScore } from "@/lib/scoring"
import { captureSnapshot } from "@/lib/snapshot"

const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  secondaryCategory: z.string().max(50).optional().nullable(),
  monthlyCost: z.number().positive(),
  usageFrequency: z.enum(["daily", "weekly", "monthly", "rare"]),
  importance: z.enum(["low", "medium", "high"]),
  // New fields
  billingCycle: z.enum(["monthly", "annual", "quarterly", "trial"]).default("monthly"),
  renewalDate: z.string().datetime().optional().nullable(),
  cancellationFriction: z.enum(["easy", "moderate", "painful"]).default("moderate"),
  usageScope: z.enum(["personal", "team", "family"]).default("personal"),
  trialEndDate: z.string().datetime().optional().nullable(),
  trialReminderEnabled: z.boolean().default(true),
  trialReminderDays: z.number().min(1).max(30).default(3),
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

    const {
      name,
      category,
      secondaryCategory,
      monthlyCost,
      usageFrequency,
      importance,
      billingCycle,
      renewalDate,
      cancellationFriction,
      usageScope,
      trialEndDate,
      trialReminderEnabled,
      trialReminderDays,
    } = validation.data

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

    // Calculate ROI score and status (with billing cycle, usage scope, and friction)
    const roiScore = calculateROIScore(
      usageFrequency,
      importance,
      monthlyCost,
      category,
      secondaryCategory,
      billingCycle,
      usageScope,
      cancellationFriction
    )
    const status = getStatusFromScore(roiScore)

    const subscription = await prisma.subscription.create({
      data: {
        name,
        category,
        secondaryCategory,
        monthlyCost,
        usageFrequency,
        importance,
        roiScore,
        status,
        userId: user.id,
        billingCycle,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        cancellationFriction,
        usageScope,
        trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
        trialReminderEnabled,
        trialReminderDays,
      },
    })

    // Capture initial snapshot for analytics
    await captureSnapshot(subscription, user.id)

    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to create subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
