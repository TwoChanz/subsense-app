import Stripe from "stripe"

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
})

// Price ID for Pro subscription
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!

// Pro plan details
export const PRO_PLAN = {
  name: "SubSense Pro",
  price: 4.99,
  currency: "usd",
  interval: "month" as const,
  features: [
    "Cloud Sync across devices",
    "Advanced Analytics & Insights",
    "Smart Renewal Alerts",
    "Weekly Email Reports",
    "Priority Support",
  ],
}
