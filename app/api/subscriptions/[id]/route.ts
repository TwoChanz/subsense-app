import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { calculateROIScore, getStatusFromScore } from "@/lib/scoring"

const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).optional(),
  monthlyCost: z.number().positive().optional(),
  usageFrequency: z.enum(["daily", "weekly", "monthly", "rare"]).optional(),
  importance: z.enum(["low", "medium", "high"]).optional(),
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

    const { name, category, monthlyCost, usageFrequency, importance } = validation.data

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

    // Calculate new ROI score if any relevant fields changed (now category-aware)
    const updatedUsageFrequency = usageFrequency ?? existing.usageFrequency
    const updatedImportance = importance ?? existing.importance
    const updatedMonthlyCost = monthlyCost ?? existing.monthlyCost
    const updatedCategory = category ?? existing.category

    const roiScore = calculateROIScore(
      updatedUsageFrequency as "daily" | "weekly" | "monthly" | "rare",
      updatedImportance as "low" | "medium" | "high",
      updatedMonthlyCost,
      updatedCategory
    )
    const status = getStatusFromScore(roiScore)

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(monthlyCost !== undefined && { monthlyCost }),
        ...(usageFrequency && { usageFrequency }),
        ...(importance && { importance }),
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
