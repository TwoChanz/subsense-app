import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")
    const excludeId = searchParams.get("excludeId")

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const existing = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        name: { equals: name.trim(), mode: "insensitive" },
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })

    return NextResponse.json({ isDuplicate: !!existing })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to check duplicate:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
