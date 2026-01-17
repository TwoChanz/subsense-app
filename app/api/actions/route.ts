import { NextResponse } from "next/server"
import { getSubscriptions } from "@/lib/store"
import { generateActionItems, calculatePotentialSavings, getCancellationGuide, getGenericCancellationTips } from "@/lib/actions"

export async function GET() {
  try {
    const subscriptions = getSubscriptions()
    const actions = generateActionItems(subscriptions)
    const potentialSavings = calculatePotentialSavings(actions)

    return NextResponse.json({
      actions,
      potentialSavings,
      totalCount: actions.length,
    })
  } catch (error) {
    console.error("Failed to get actions:", error)
    return NextResponse.json(
      { error: "Failed to get actions" },
      { status: 500 }
    )
  }
}
