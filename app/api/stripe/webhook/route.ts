import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      console.log("Checkout completed:", session.id)

      const userId = session.metadata?.userId
      if (!userId) {
        console.error("No userId in session metadata")
        break
      }

      // Retrieve the subscription to get period end
      const subscriptionId = session.subscription as string
      const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const periodEnd = (subscriptionData as any).current_period_end as number

      // Update user as Pro
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscriptionId,
          stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
          isPro: true,
          proStatus: "ACTIVE",
        },
      })

      console.log(`User ${userId} upgraded to Pro`)
      break
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("Subscription updated:", subscription.id)

      // Find user by subscription ID
      const user = await prisma.user.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      })

      if (!user) {
        console.error("No user found for subscription:", subscription.id)
        break
      }

      // Map Stripe status to our proStatus
      let proStatus: string
      let isPro: boolean
      const status = subscription.status
      switch (status) {
        case "active":
        case "trialing":
          proStatus = "ACTIVE"
          isPro = true
          break
        case "past_due":
          proStatus = "PAST_DUE"
          isPro = true // Still Pro but payment is late
          break
        case "canceled":
        case "unpaid":
          proStatus = "CANCELED"
          isPro = false
          break
        default:
          proStatus = "ACTIVE"
          isPro = false
      }

      // Update user subscription status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subPeriodEnd = (subscription as any).current_period_end as number
      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeCurrentPeriodEnd: new Date(subPeriodEnd * 1000),
          isPro,
          proStatus,
        },
      })

      console.log(`User ${user.id} subscription updated: ${proStatus}`)
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      console.log("Subscription canceled:", subscription.id)

      // Find and downgrade user
      const user = await prisma.user.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      })

      if (!user) {
        console.error("No user found for subscription:", subscription.id)
        break
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPro: false,
          proStatus: "CANCELED",
          stripeSubscriptionId: null,
          stripeCurrentPeriodEnd: null,
        },
      })

      console.log(`User ${user.id} downgraded from Pro`)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      console.log("Payment failed for invoice:", invoice.id)

      // Find user by customer ID
      const customerId = invoice.customer as string
      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      })

      if (!user) {
        console.error("No user found for customer:", customerId)
        break
      }

      // Mark user as past due
      await prisma.user.update({
        where: { id: user.id },
        data: {
          proStatus: "PAST_DUE",
        },
      })

      console.log(`User ${user.id} marked as PAST_DUE`)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
