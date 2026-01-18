import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { calculateVendorConfidence } from "@/lib/vendor-confidence"

const feedbackSchema = z.object({
  result: z.enum(["success", "fail", "skip"]),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id: vendorId } = await params

    const body = await request.json()
    const validation = feedbackSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { result } = validation.data

    // Check vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Create feedback record
    await prisma.vendorLinkFeedback.create({
      data: {
        vendorId,
        userId: user.id,
        action: "open_billing_link",
        result,
      },
    })

    // Recalculate vendor confidence based on all feedback
    const allFeedback = await prisma.vendorLinkFeedback.groupBy({
      by: ["result"],
      where: { vendorId },
      _count: true,
    })

    const stats = {
      successCount: 0,
      failCount: 0,
      skipCount: 0,
    }

    for (const fb of allFeedback) {
      if (fb.result === "success") stats.successCount = fb._count
      else if (fb.result === "fail") stats.failCount = fb._count
      else if (fb.result === "skip") stats.skipCount = fb._count
    }

    const newConfidence = calculateVendorConfidence(stats)

    // Update vendor confidence and last verified date (only on success)
    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        confidence: newConfidence,
        ...(result === "success" && { lastVerifiedAt: new Date() }),
      },
    })

    return NextResponse.json({
      success: true,
      confidence: newConfidence,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to submit feedback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
