"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, BarChart3, Bell, Mail, Cloud } from "lucide-react"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
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
            <Badge variant="secondary" className="mt-2">
              <Zap className="mr-1 h-3 w-3" />
              Coming Soon
            </Badge>
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
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <Button className="w-full" disabled>
            <Check className="mr-2 h-4 w-4" />
            Notify Me When Available
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            We&apos;ll let you know when Pro is ready
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
