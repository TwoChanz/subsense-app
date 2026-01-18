import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { backfillAllUserSnapshots } from "@/lib/snapshot"

export async function POST() {
  try {
    const user = await requireUser()

    // Backfill historical snapshots for all user subscriptions
    const count = await backfillAllUserSnapshots(user.id)

    return NextResponse.json({
      success: true,
      message: `Created ${count} historical snapshots`,
      snapshotsCreated: count,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to backfill snapshots:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
