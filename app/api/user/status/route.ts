import { NextResponse } from "next/server"
import { getOrCreateUser } from "@/lib/auth"
import { getProStatus, ProStatusInfo } from "@/lib/pro"

export interface UserStatusResponse {
  isAuthenticated: boolean
  proStatus: ProStatusInfo | null
}

export async function GET() {
  try {
    const user = await getOrCreateUser()

    if (!user) {
      return NextResponse.json<UserStatusResponse>({
        isAuthenticated: false,
        proStatus: null,
      })
    }

    const proStatus = await getProStatus(user.id)

    return NextResponse.json<UserStatusResponse>({
      isAuthenticated: true,
      proStatus,
    })
  } catch (error) {
    console.error("Error fetching user status:", error)
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    )
  }
}
