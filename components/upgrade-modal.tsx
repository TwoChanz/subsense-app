"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Zap, BarChart3, Bell, Mail, Cloud, Loader2, CreditCard } from "lucide-react"
import { createCheckoutSession } from "@/lib/stripe-client"
import { toast } from "sonner"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEmail?: string
}

const proFeatures = [
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Sync your data across all devices",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Detailed spending trends and insights",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified before renewals",
  },
  {
    icon: Mail,
    title: "Email Reports",
    description: "Weekly ROI summaries to your inbox",
  },
]

export function UpgradeModal({ open, onOpenChange, defaultEmail = "" }: UpgradeModalProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsLoading(true)
    try {
      const checkoutUrl = await createCheckoutSession(email)
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Failed to start checkout", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription>
            Unlock powerful features to optimize your subscriptions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pricing */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold">$4.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cancel anytime
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 pt-2">
            {proFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Email Input */}
          <div className="space-y-2 pt-2">
            <Label htmlFor="checkout-email">Email address</Label>
            <Input
              id="checkout-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={handleCheckout}
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Secure payment via Stripe</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
