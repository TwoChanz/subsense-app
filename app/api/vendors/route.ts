import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { sanitizeVendorUrl, extractDomainFromUrl } from "@/lib/url-sanitizer"

const createVendorSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().min(1).max(255),
  billingUrl: z.string().max(2000).optional().nullable(),
  cancelHelpUrl: z.string().max(2000).optional().nullable(),
})

export async function GET(request: Request) {
  try {
    await requireUser()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let vendors
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      vendors = await prisma.vendor.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { domain: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        orderBy: [
          { confidence: "desc" }, // high > medium > low
          { name: "asc" },
        ],
        take: 20,
      })
    } else {
      vendors = await prisma.vendor.findMany({
        orderBy: [
          { confidence: "desc" },
          { name: "asc" },
        ],
        take: 50,
      })
    }

    return NextResponse.json(vendors)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to fetch vendors:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireUser()

    const body = await request.json()
    const validation = createVendorSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, domain: rawDomain, billingUrl, cancelHelpUrl } = validation.data

    // Extract and normalize domain
    const domain = extractDomainFromUrl(rawDomain) || rawDomain.toLowerCase().trim()
    if (!domain) {
      return NextResponse.json(
        { error: "Invalid domain" },
        { status: 400 }
      )
    }

    // Check for existing vendor with same domain
    const existing = await prisma.vendor.findUnique({
      where: { domain },
    })

    if (existing) {
      return NextResponse.json(
        { error: "A vendor with this domain already exists", vendor: existing },
        { status: 409 }
      )
    }

    // Sanitize billing URL if provided
    let sanitizedBillingUrl: string | null = null
    if (billingUrl) {
      const result = sanitizeVendorUrl(billingUrl)
      if (!result.success) {
        return NextResponse.json(
          { error: `Invalid billing URL: ${result.error}` },
          { status: 400 }
        )
      }
      sanitizedBillingUrl = result.url!
    }

    // Sanitize cancel help URL if provided
    let sanitizedCancelHelpUrl: string | null = null
    if (cancelHelpUrl) {
      const result = sanitizeVendorUrl(cancelHelpUrl)
      if (!result.success) {
        return NextResponse.json(
          { error: `Invalid cancel help URL: ${result.error}` },
          { status: 400 }
        )
      }
      sanitizedCancelHelpUrl = result.url!
    }

    // Create vendor with user_submitted source and low confidence
    const vendor = await prisma.vendor.create({
      data: {
        name,
        domain,
        billingUrl: sanitizedBillingUrl,
        cancelHelpUrl: sanitizedCancelHelpUrl,
        source: "user_submitted",
        confidence: "low", // New user-submitted vendors start with low confidence
      },
    })

    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Failed to create vendor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
