"use client"

// Force dynamic rendering to avoid build-time prerender issues with Clerk auth
export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { fetchSubscriptions } from "@/lib/api"
import type { Subscription } from "@/lib/types"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface RenewalEvent {
  subscription: Subscription
  date: Date
  isTrial: boolean
}

export default function CalendarPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const loadData = useCallback(async () => {
    try {
      const subs = await fetchSubscriptions()
      setSubscriptions(subs)
    } catch (error) {
      console.error("Failed to load subscriptions:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Generate calendar data
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    // Build events map
    const eventsMap = new Map<string, RenewalEvent[]>()

    for (const sub of subscriptions) {
      // Check trial end dates
      if (sub.billingCycle === "trial" && sub.trialEndDate) {
        const trialEnd = new Date(sub.trialEndDate)
        if (trialEnd.getMonth() === month && trialEnd.getFullYear() === year) {
          const key = trialEnd.getDate().toString()
          const existing = eventsMap.get(key) || []
          eventsMap.set(key, [...existing, { subscription: sub, date: trialEnd, isTrial: true }])
        }
      }
      // Check renewal dates
      else if (sub.renewalDate) {
        const renewalDate = new Date(sub.renewalDate)
        if (renewalDate.getMonth() === month && renewalDate.getFullYear() === year) {
          const key = renewalDate.getDate().toString()
          const existing = eventsMap.get(key) || []
          eventsMap.set(key, [...existing, { subscription: sub, date: renewalDate, isTrial: false }])
        }
      }
    }

    return { firstDay, lastDay, startingDayOfWeek, daysInMonth, eventsMap }
  }, [subscriptions, currentMonth])

  // Calculate monthly totals
  const monthlyStats = useMemo(() => {
    let totalRenewalAmount = 0
    let renewalCount = 0
    let trialCount = 0

    calendarData.eventsMap.forEach((events) => {
      events.forEach((event) => {
        if (event.isTrial) {
          trialCount++
        } else {
          renewalCount++
          totalRenewalAmount += event.subscription.monthlyCost
        }
      })
    })

    return { totalRenewalAmount, renewalCount, trialCount }
  }, [calendarData])

  const navigateMonth = (direction: -1 | 1) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + direction)
      return newDate
    })
  }

  const today = new Date()
  const isCurrentMonth =
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear()

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Renewal Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Track upcoming subscription renewals and trial endings
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{monthlyStats.renewalCount}</p>
              <p className="text-xs text-muted-foreground">Renewals this month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-500/10 p-2">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">${monthlyStats.totalRenewalAmount.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total renewal charges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Clock className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{monthlyStats.trialCount}</p>
              <p className="text-xs text-muted-foreground">Trials ending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {!isCurrentMonth && (
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                  Today
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {/* Header */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before first of month */}
            {Array.from({ length: calendarData.startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-background p-2 min-h-[100px]" />
            ))}

            {/* Day cells */}
            {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
              const dayNumber = i + 1
              const events = calendarData.eventsMap.get(dayNumber.toString()) || []
              const isToday =
                isCurrentMonth && today.getDate() === dayNumber

              return (
                <div
                  key={dayNumber}
                  className={cn(
                    "bg-background p-2 min-h-[100px] relative",
                    isToday && "bg-accent/30"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isToday &&
                        "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                    )}
                  >
                    {dayNumber}
                  </span>

                  {/* Events */}
                  <div className="mt-1 space-y-1">
                    {events.slice(0, 3).map((event, idx) => (
                      <Link
                        key={`${event.subscription.id}-${idx}`}
                        href={`/reports/${event.subscription.id}`}
                        className={cn(
                          "block text-xs p-1 rounded truncate",
                          event.isTrial
                            ? "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                            : event.subscription.status === "cut"
                            ? "bg-red-500/10 text-red-700 dark:text-red-300"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                        )}
                      >
                        {event.isTrial && "⏱ "}
                        {event.subscription.name}
                      </Link>
                    ))}
                    {events.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{events.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.from(calendarData.eventsMap.entries())
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([day, events]) => (
              <div key={day} className="mb-4 last:mb-0">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {new Date(currentMonth.getFullYear(), currentMonth.getMonth(), parseInt(day)).toLocaleDateString(
                    "en-US",
                    { weekday: "long", month: "short", day: "numeric" }
                  )}
                </p>
                <div className="space-y-2">
                  {events.map((event) => (
                    <Link
                      key={event.subscription.id}
                      href={`/reports/${event.subscription.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">{event.subscription.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {event.subscription.category}
                            </span>
                            {event.isTrial && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0 bg-purple-500/10 text-purple-500 border-purple-500/20"
                              >
                                Trial Ending
                              </Badge>
                            )}
                            <StatusBadge status={event.subscription.status} className="scale-90" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm tabular-nums">
                          ${event.subscription.monthlyCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.subscription.billingCycle}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

          {calendarData.eventsMap.size === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No renewals or trials ending this month</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
