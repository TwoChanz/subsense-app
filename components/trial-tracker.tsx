"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Subscription } from "@/lib/types"
import {
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TrialTrackerProps {
  subscriptions: Subscription[]
  onCancel?: (subscriptionId: string) => void
  onKeep?: (subscriptionId: string) => void
  maxItems?: number
  showAddButton?: boolean
}

interface TrialItem {
  subscription: Subscription
  daysRemaining: number
  totalDays: number
  progressPercent: number
  isExpired: boolean
  isUrgent: boolean
}

export function TrialTracker({
  subscriptions,
  onCancel,
  onKeep,
  maxItems = 5,
  showAddButton = true,
}: TrialTrackerProps) {
  const trials = useMemo(() => {
    const now = new Date()

    return subscriptions
      .filter((sub) => sub.billingCycle === "trial" && sub.trialEndDate)
      .map((sub) => {
        const endDate = new Date(sub.trialEndDate!)
        const createdDate = new Date(sub.createdAt)

        const totalDays = Math.ceil(
          (endDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        const daysRemaining = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        const daysElapsed = totalDays - daysRemaining
        const progressPercent = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100))

        return {
          subscription: sub,
          daysRemaining: Math.max(0, daysRemaining),
          totalDays,
          progressPercent,
          isExpired: daysRemaining <= 0,
          isUrgent: daysRemaining > 0 && daysRemaining <= 3,
        } as TrialItem
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [subscriptions])

  const activeTrials = trials.filter((t) => !t.isExpired)
  const expiredTrials = trials.filter((t) => t.isExpired)
  const displayedTrials = activeTrials.slice(0, maxItems)
  const hasMore = activeTrials.length > maxItems

  if (trials.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-purple-500" />
            Trial Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-purple-500/10 p-3 mb-3">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-sm font-medium">No active trials</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Add trials you're testing and we'll remind you before they convert to paid
            </p>
            {showAddButton && (
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/add?type=trial">
                  Add Trial
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-purple-500" />
            Trial Tracker
            {activeTrials.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeTrials.length}
              </Badge>
            )}
          </CardTitle>
          {showAddButton && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/add?type=trial">
                Add Trial
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Expired trials warning */}
        {expiredTrials.length > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <span className="text-red-500">
              {expiredTrials.length} trial{expiredTrials.length !== 1 ? "s" : ""} expired
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs text-red-500 hover:text-red-600"
              asChild
            >
              <Link href="/trials?filter=expired">Review</Link>
            </Button>
          </div>
        )}

        {/* Active trials */}
        {displayedTrials.map((trial) => (
          <TrialItem
            key={trial.subscription.id}
            trial={trial}
            onCancel={onCancel}
            onKeep={onKeep}
          />
        ))}

        {hasMore && (
          <div className="pt-2 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/trials">
                View all {activeTrials.length} trials
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TrialItemProps {
  trial: TrialItem
  onCancel?: (subscriptionId: string) => void
  onKeep?: (subscriptionId: string) => void
}

function TrialItem({ trial, onCancel, onKeep }: TrialItemProps) {
  const { subscription: sub, daysRemaining, progressPercent, isExpired, isUrgent } = trial

  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-2",
        isExpired && "border-red-500/30 bg-red-500/5",
        isUrgent && !isExpired && "border-amber-500/30 bg-amber-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{sub.name}</span>
            {isExpired ? (
              <Badge
                variant="outline"
                className="bg-red-500/10 text-red-500 border-red-500/20 text-xs"
              >
                Expired
              </Badge>
            ) : isUrgent ? (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {daysRemaining}d left
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                {daysRemaining}d left
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sub.category} &middot; ${sub.monthlyCost.toFixed(2)}/mo after trial
          </p>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/reports/${sub.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress
          value={progressPercent}
          className={cn(
            "h-1.5",
            isExpired && "[&>div]:bg-red-500",
            isUrgent && !isExpired && "[&>div]:bg-amber-500"
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Trial started</span>
          <span>
            {sub.trialEndDate
              ? new Date(sub.trialEndDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onCancel(sub.id)}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        )}
        {onKeep && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onKeep(sub.id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Keep
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
          <Link href={`/reports/${sub.id}`}>Details</Link>
        </Button>
      </div>
    </div>
  )
}

// Compact list for sidebar
export function TrialList({
  subscriptions,
}: {
  subscriptions: Subscription[]
}) {
  const now = new Date()

  const trials = subscriptions
    .filter((sub) => sub.billingCycle === "trial" && sub.trialEndDate)
    .map((sub) => {
      const endDate = new Date(sub.trialEndDate!)
      const daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return { subscription: sub, daysRemaining }
    })
    .filter((t) => t.daysRemaining > 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)

  if (trials.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No active trials</p>
    )
  }

  return (
    <div className="space-y-1.5">
      {trials.slice(0, 5).map(({ subscription: sub, daysRemaining }) => (
        <div
          key={sub.id}
          className="flex items-center justify-between text-sm"
        >
          <span className="truncate">{sub.name}</span>
          <span
            className={cn(
              "text-xs tabular-nums",
              daysRemaining <= 3 ? "text-amber-500 font-medium" : "text-muted-foreground"
            )}
          >
            {daysRemaining}d
          </span>
        </div>
      ))}
    </div>
  )
}
