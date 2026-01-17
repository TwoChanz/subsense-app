import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { calculateROIScore, getStatusFromScore } from "@/lib/scoring"

const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).optional(),
  secondaryCategory: z.string().max(50).optional().nullable(),
  monthlyCost: z.number().positive().optional(),
  usageFrequency: z.enum(["daily", "weekly", "monthly", "rare"]).optional(),
  importance: z.enum(["low", "medium", "high"]).optional(),
  // New fields
  billingCycle: z.enum(["monthly", "annual", "quarterly", "trial"]).optional(),
  renewalDate: z.string().datetime().optional().nullable(),
  cancellationFriction: z.enum(["easy", "moderate", "painful"]).optional(),
  usageScope: z.enum(["personal", "team", "family"]).optional(),
  trialEndDate: z.string().datetime().optional().nullable(),
  trialReminderEnabled: z.boolean().optional(),
  trialReminderDays: z.number().min(1).max(30).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const subscription = await prisma.subscription.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const body = await request.json()
    const validation = updateSubscriptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    // Check subscription exists and belongs to user
    const existing = await prisma.subscription.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
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

    // Check for duplicate name if name is being updated
    if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          name: { equals: name, mode: "insensitive" },
          NOT: { id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "A subscription with this name already exists" },
          { status: 409 }
        )
      }
    }

    // Calculate new ROI score with all parameters
    const updatedUsageFrequency = usageFrequency ?? existing.usageFrequency
    const updatedImportance = importance ?? existing.importance
    const updatedMonthlyCost = monthlyCost ?? existing.monthlyCost
    const updatedCategory = category ?? existing.category
    // Handle secondaryCategory: undefined means not provided, null means explicitly cleared
    const updatedSecondaryCategory = secondaryCategory === undefined
      ? existing.secondaryCategory
      : secondaryCategory
    const updatedBillingCycle = billingCycle ?? existing.billingCycle
    const updatedUsageScope = usageScope ?? existing.usageScope
    const updatedCancellationFriction = cancellationFriction ?? existing.cancellationFriction

    const roiScore = calculateROIScore(
      updatedUsageFrequency as "daily" | "weekly" | "monthly" | "rare",
      updatedImportance as "low" | "medium" | "high",
      updatedMonthlyCost,
      updatedCategory,
      updatedSecondaryCategory,
      updatedBillingCycle as "monthly" | "annual" | "quarterly" | "trial",
      updatedUsageScope as "personal" | "team" | "family",
      updatedCancellationFriction as "easy" | "moderate" | "painful"
    )
    const status = getStatusFromScore(roiScore)

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(secondaryCategory !== undefined && { secondaryCategory }),
        ...(monthlyCost !== undefined && { monthlyCost }),
        ...(usageFrequency && { usageFrequency }),
        ...(importance && { importance }),
        ...(billingCycle && { billingCycle }),
        ...(renewalDate !== undefined && { renewalDate: renewalDate ? new Date(renewalDate) : null }),
        ...(cancellationFriction && { cancellationFriction }),
        ...(usageScope && { usageScope }),
        ...(trialEndDate !== undefined && { trialEndDate: trialEndDate ? new Date(trialEndDate) : null }),
        ...(trialReminderEnabled !== undefined && { trialReminderEnabled }),
        ...(trialReminderDays !== undefined && { trialReminderDays }),
        roiScore,
        status,
      },
    })

    return NextResponse.json(subscription)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to update subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Check subscription exists and belongs to user
    const existing = await prisma.subscription.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    await prisma.subscription.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to delete subscription:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
