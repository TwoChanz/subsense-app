import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

export async function getOrCreateUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  // If not found, create new user
  if (!user) {
    const clerkUser = await currentUser()

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? null,
      },
    })

    // Create default settings for new user
    await prisma.userSettings.create({
      data: {
        userId: user.id,
        pushNotifications: true,
        emailReports: false,
        emailAddress: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
      },
    })
  }

  return user
}

export async function requireUser() {
  const user = await getOrCreateUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}
