import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface InvoiceItem {
  id: string
  number: string | null
  amountPaid: number
  amountDue: number
  currency: string
  status: string | null
  created: number
  hostedInvoiceUrl: string | null | undefined
  invoicePdf: string | null | undefined
  periodStart: number
  periodEnd: number
}

export async function GET() {
  try {
    const user = await requireUser()

    // Get user's Stripe customer ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true },
    })

    if (!dbUser?.stripeCustomerId) {
      return NextResponse.json<InvoiceItem[]>([])
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: dbUser.stripeCustomerId,
      limit: 24, // Last 2 years of monthly invoices
    })

    const invoiceItems: InvoiceItem[] = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
    }))

    return NextResponse.json<InvoiceItem[]>(invoiceItems)
  } catch (error) {
    console.error("Invoices fetch error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Please sign in to view invoices" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}
