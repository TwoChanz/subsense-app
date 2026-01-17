"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import type { Subscription } from "@/lib/types"
import {
  CalendarDays,
  ChevronRight,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RenewalCalendarProps {
  subscriptions: Subscription[]
  daysAhead?: number
  maxItems?: number
  showViewAll?: boolean
}

interface RenewalItem {
  subscription: Subscription
  renewalDate: Date
  daysUntil: number
  isToday: boolean
  isTrial: boolean
}

export function RenewalCalendar({
  subscriptions,
  daysAhead = 30,
  maxItems = 5,
  showViewAll = true,
}: RenewalCalendarProps) {
  const upcomingRenewals = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const renewals: RenewalItem[] = []

    for (const sub of subscriptions) {
      // Check trial end dates
      if (sub.billingCycle === "trial" && sub.trialEndDate) {
        const trialEnd = new Date(sub.trialEndDate)
        trialEnd.setHours(0, 0, 0, 0)
        const daysUntil = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          renewals.push({
            subscription: sub,
            renewalDate: trialEnd,
            daysUntil,
            isToday: daysUntil === 0,
            isTrial: true,
          })
        }
      }
      // Check renewal dates
      else if (sub.renewalDate) {
        const renewalDate = new Date(sub.renewalDate)
        renewalDate.setHours(0, 0, 0, 0)
        const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          renewals.push({
            subscription: sub,
            renewalDate,
            daysUntil,
            isToday: daysUntil === 0,
            isTrial: false,
          })
        }
      }
    }

    // Sort by days until renewal
    return renewals.sort((a, b) => a.daysUntil - b.daysUntil)
  }, [subscriptions, daysAhead])

  const displayedRenewals = upcomingRenewals.slice(0, maxItems)
  const hasMore = upcomingRenewals.length > maxItems

  // Calculate total upcoming charges
  const totalUpcoming = displayedRenewals.reduce(
    (sum, r) => sum + r.subscription.monthlyCost,
    0
  )

  if (upcomingRenewals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            Upcoming Renewals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-green-500/10 p-3 mb-3">
              <CalendarDays className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-medium">No upcoming renewals</p>
            <p className="text-xs text-muted-foreground mt-1">
              No subscriptions renewing in the next {daysAhead} days
            </p>
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
            <CalendarDays className="h-5 w-5 text-blue-500" />
            This Week
          </CardTitle>
          {showViewAll && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">
                Full Calendar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          ${totalUpcoming.toFixed(2)} in upcoming charges
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedRenewals.map((renewal) => (
          <RenewalItem key={renewal.subscription.id} renewal={renewal} />
        ))}

        {hasMore && (
          <div className="pt-2 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/calendar">
                +{upcomingRenewals.length - maxItems} more
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RenewalItemProps {
  renewal: RenewalItem
}

function RenewalItem({ renewal }: RenewalItemProps) {
  const { subscription: sub, daysUntil, isToday, isTrial } = renewal

  const dayLabel = isToday
    ? "Today"
    : daysUntil === 1
    ? "Tomorrow"
    : formatDayOfWeek(renewal.renewalDate)

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg border transition-colors hover:bg-muted/50",
        isToday && "border-amber-500/30 bg-amber-500/5",
        daysUntil <= 3 && !isToday && "border-orange-500/20"
      )}
    >
      {/* Day indicator */}
      <div
        className={cn(
          "flex flex-col items-center justify-center w-12 h-12 rounded-lg text-center",
          isToday
            ? "bg-amber-500 text-white"
            : daysUntil <= 3
            ? "bg-orange-500/10 text-orange-500"
            : "bg-muted text-muted-foreground"
        )}
      >
        <span className="text-[10px] uppercase font-medium leading-none">
          {dayLabel.slice(0, 3)}
        </span>
        <span className="text-lg font-bold leading-none mt-0.5">
          {renewal.renewalDate.getDate()}
        </span>
      </div>

      {/* Subscription info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{sub.name}</span>
          {isTrial && (
            <Badge
              variant="outline"
              className="text-xs px-1.5 py-0 bg-purple-500/10 text-purple-500 border-purple-500/20"
            >
              <Clock className="h-3 w-3 mr-1" />
              Trial
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {sub.billingCycle === "annual"
              ? "Annual"
              : sub.billingCycle === "quarterly"
              ? "Quarterly"
              : "Monthly"}
          </span>
          {sub.status !== "good" && (
            <StatusBadge status={sub.status} className="scale-90" />
          )}
        </div>
      </div>

      {/* Amount and action */}
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="font-medium text-sm tabular-nums">
            ${sub.monthlyCost.toFixed(2)}
          </p>
          {sub.status === "cut" && (
            <p className="text-xs text-red-500 flex items-center justify-end gap-0.5">
              <AlertCircle className="h-3 w-3" />
              Review
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={`/reports/${sub.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function formatDayOfWeek(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" })
}

// Compact version for sidebar or smaller spaces
export function RenewalList({
  subscriptions,
  daysAhead = 7,
}: {
  subscriptions: Subscription[]
  daysAhead?: number
}) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const renewals = subscriptions
    .filter((sub) => {
      if (sub.billingCycle === "trial" && sub.trialEndDate) {
        const trialEnd = new Date(sub.trialEndDate)
        const daysUntil = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil >= 0 && daysUntil <= daysAhead
      }
      if (sub.renewalDate) {
        const renewalDate = new Date(sub.renewalDate)
        const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil >= 0 && daysUntil <= daysAhead
      }
      return false
    })
    .sort((a, b) => {
      const dateA = a.billingCycle === "trial" ? a.trialEndDate : a.renewalDate
      const dateB = b.billingCycle === "trial" ? b.trialEndDate : b.renewalDate
      if (!dateA || !dateB) return 0
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })

  if (renewals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No renewals in the next {daysAhead} days
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      {renewals.map((sub) => {
        const date = sub.billingCycle === "trial" ? sub.trialEndDate : sub.renewalDate
        if (!date) return null

        const renewalDate = new Date(date)
        const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return (
          <div
            key={sub.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="truncate">{sub.name}</span>
            <span
              className={cn(
                "text-xs tabular-nums",
                daysUntil <= 3 ? "text-amber-500" : "text-muted-foreground"
              )}
            >
              {daysUntil === 0
                ? "Today"
                : daysUntil === 1
                ? "Tomorrow"
                : `${daysUntil}d`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
