import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

const updateSettingsSchema = z.object({
  pushNotifications: z.boolean().optional(),
  emailReports: z.boolean().optional(),
  emailAddress: z.string().email().or(z.literal("")).optional(),
})

export async function GET() {
  try {
    const user = await requireUser()

    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    })

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          pushNotifications: true,
          emailReports: false,
          emailAddress: "",
        },
      })
    }

    return NextResponse.json({
      pushNotifications: settings.pushNotifications,
      emailReports: settings.emailReports,
      emailAddress: settings.emailAddress,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser()

    const body = await request.json()
    const validation = updateSettingsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { pushNotifications, emailReports, emailAddress } = validation.data

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        pushNotifications: pushNotifications ?? true,
        emailReports: emailReports ?? false,
        emailAddress: emailAddress ?? "",
      },
      update: {
        ...(pushNotifications !== undefined && { pushNotifications }),
        ...(emailReports !== undefined && { emailReports }),
        ...(emailAddress !== undefined && { emailAddress }),
      },
    })

    return NextResponse.json({
      pushNotifications: settings.pushNotifications,
      emailReports: settings.emailReports,
      emailAddress: settings.emailAddress,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
