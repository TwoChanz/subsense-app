import { NextRequest, NextResponse } from "next/server"
import { stripe, PRO_PLAN } from "@/lib/stripe"
import { requireUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Require authenticated user
    const user = await requireUser()

    const body = await request.json()
    const { email } = body

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create or get price dynamically (for demo without pre-created price)
    let priceId = process.env.STRIPE_PRO_PRICE_ID

    if (!priceId) {
      // Create a product and price on the fly for testing
      const product = await stripe.products.create({
        name: PRO_PLAN.name,
        description: "Unlock advanced features for subscription optimization",
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(PRO_PLAN.price * 100), // Convert to cents
        currency: PRO_PLAN.currency,
        recurring: {
          interval: PRO_PLAN.interval,
        },
      })

      priceId = price.id
    }

    // Create Stripe checkout session with userId in metadata
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email || user.email || undefined,
      success_url: `${appUrl}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?canceled=true`,
      metadata: {
        plan: "pro",
        userId: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Please sign in to upgrade" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
