"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Subscription } from "@/lib/types"
import { Activity, ChevronRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubscriptionHealthProps {
  subscriptions: Subscription[]
  showViewAll?: boolean
}

export function SubscriptionHealth({
  subscriptions,
  showViewAll = true,
}: SubscriptionHealthProps) {
  const healthCounts = {
    good: subscriptions.filter((s) => s.status === "good").length,
    review: subscriptions.filter((s) => s.status === "review").length,
    cut: subscriptions.filter((s) => s.status === "cut").length,
  }

  const total = subscriptions.length
  const healthyPercent = total > 0 ? Math.round((healthCounts.good / total) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-blue-500" />
            Subscription Health
          </CardTitle>
          {showViewAll && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health bar */}
        <div className="space-y-2">
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            {healthCounts.good > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(healthCounts.good / total) * 100}%` }}
              />
            )}
            {healthCounts.review > 0 && (
              <div
                className="bg-amber-500 transition-all"
                style={{ width: `${(healthCounts.review / total) * 100}%` }}
              />
            )}
            {healthCounts.cut > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(healthCounts.cut / total) * 100}%` }}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {healthyPercent}% of subscriptions are healthy
          </p>
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <StatusBox
            status="good"
            count={healthCounts.good}
            label="Good"
            icon={CheckCircle2}
          />
          <StatusBox
            status="review"
            count={healthCounts.review}
            label="Review"
            icon={AlertTriangle}
          />
          <StatusBox
            status="cut"
            count={healthCounts.cut}
            label="Cut"
            icon={XCircle}
          />
        </div>

        {/* Quick action if there are items to cut */}
        {healthCounts.cut > 0 && (
          <div className="pt-2 border-t">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/?filter=cut">
                Review {healthCounts.cut} subscription{healthCounts.cut !== 1 ? "s" : ""} to cut
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatusBoxProps {
  status: "good" | "review" | "cut"
  count: number
  label: string
  icon: typeof CheckCircle2
}

const statusConfig = {
  good: {
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  review: {
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  cut: {
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
}

function StatusBox({ status, count, label, icon: Icon }: StatusBoxProps) {
  const config = statusConfig[status]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-lg border",
        config.bgColor,
        config.borderColor
      )}
    >
      <Icon className={cn("h-5 w-5 mb-1", config.color)} />
      <span className="text-xl font-bold">{count}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// Compact inline version
export function HealthBar({
  subscriptions,
}: {
  subscriptions: Subscription[]
}) {
  const counts = {
    good: subscriptions.filter((s) => s.status === "good").length,
    review: subscriptions.filter((s) => s.status === "review").length,
    cut: subscriptions.filter((s) => s.status === "cut").length,
  }
  const total = subscriptions.length

  if (total === 0) return null

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-2 w-24 rounded-full overflow-hidden bg-muted">
        {counts.good > 0 && (
          <div
            className="bg-green-500"
            style={{ width: `${(counts.good / total) * 100}%` }}
          />
        )}
        {counts.review > 0 && (
          <div
            className="bg-amber-500"
            style={{ width: `${(counts.review / total) * 100}%` }}
          />
        )}
        {counts.cut > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${(counts.cut / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-green-500">{counts.good}</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-amber-500">{counts.review}</span>
        <span className="text-muted-foreground">|</span>
        <span className="text-red-500">{counts.cut}</span>
      </div>
    </div>
  )
}
