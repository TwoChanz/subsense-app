import { NextResponse } from "next/server"
import {
  getUserData,
  recordReviewCompletion,
  recordSavings,
  completeAction,
  snoozeAction,
  unsnoozeAction,
  resetUserData,
} from "@/lib/user-store"

export async function GET() {
  try {
    const userData = getUserData()
    return NextResponse.json(userData)
  } catch (error) {
    console.error("Failed to get user data:", error)
    return NextResponse.json(
      { error: "Failed to get user data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    let result

    switch (action) {
      case "recordReview":
        result = recordReviewCompletion()
        break
      case "recordSavings":
        if (typeof params.monthlySavings !== "number" || !params.type) {
          return NextResponse.json(
            { error: "Missing monthlySavings or type" },
            { status: 400 }
          )
        }
        result = recordSavings(params.monthlySavings, params.type)
        break
      case "completeAction":
        if (!params.actionId) {
          return NextResponse.json(
            { error: "Missing actionId" },
            { status: 400 }
          )
        }
        result = completeAction(params.actionId)
        break
      case "snoozeAction":
        if (!params.actionId || !params.until) {
          return NextResponse.json(
            { error: "Missing actionId or until" },
            { status: 400 }
          )
        }
        result = snoozeAction(params.actionId, new Date(params.until))
        break
      case "unsnoozeAction":
        if (!params.actionId) {
          return NextResponse.json(
            { error: "Missing actionId" },
            { status: 400 }
          )
        }
        result = unsnoozeAction(params.actionId)
        break
      case "reset":
        resetUserData()
        result = getUserData()
        break
      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to update user data:", error)
    return NextResponse.json(
      { error: "Failed to update user data" },
      { status: 500 }
    )
  }
}
