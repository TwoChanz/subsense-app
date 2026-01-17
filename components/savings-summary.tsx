"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SavingsData } from "@/lib/types"
import {
  PiggyBank,
  TrendingUp,
  Trophy,
  Share2,
  XCircle,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SavingsSummaryProps {
  savings: SavingsData
  onShare?: () => void
  variant?: "card" | "compact" | "inline"
}

export function SavingsSummary({
  savings,
  onShare,
  variant = "card",
}: SavingsSummaryProps) {
  if (variant === "inline") {
    return (
      <div className="flex items-center gap-1.5 text-green-500">
        <PiggyBank className="h-4 w-4" />
        <span className="font-medium">${savings.totalSavedThisMonth.toFixed(0)}</span>
        <span className="text-xs text-muted-foreground">saved</span>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-sm font-medium cursor-default">
              <PiggyBank className="h-4 w-4" />
              <span>${savings.totalSavedThisMonth.toFixed(0)} saved</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">Savings Summary</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">This month:</span>
                <span className="font-medium">${savings.totalSavedThisMonth.toFixed(2)}</span>
                <span className="text-muted-foreground">This year:</span>
                <span className="font-medium">${savings.totalSavedThisYear.toFixed(2)}</span>
                <span className="text-muted-foreground">All time:</span>
                <span className="font-medium">${savings.totalSavedAllTime.toFixed(2)}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const hasAnySavings = savings.totalSavedAllTime > 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PiggyBank className="h-5 w-5 text-green-500" />
            Savings
          </CardTitle>
          {onShare && hasAnySavings && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasAnySavings ? (
          <div className="space-y-4">
            {/* Main savings display */}
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold text-green-500">
                  ${savings.totalSavedThisMonth.toFixed(0)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">saved this month</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="text-center">
                <p className="text-lg font-semibold">
                  ${savings.totalSavedThisYear.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">this year</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  ${savings.totalSavedAllTime.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">all time</p>
              </div>
            </div>

            {/* Actions taken */}
            <div className="flex justify-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-1.5 text-sm">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium">{savings.subscriptionsCanceled}</span>
                <span className="text-muted-foreground">canceled</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{savings.subscriptionsDowngraded}</span>
                <span className="text-muted-foreground">downgraded</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <PiggyBank className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No savings yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Cancel or downgrade subscriptions to start tracking your savings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Achievement milestone display
export function SavingsMilestone({
  amount,
  achieved,
  label,
}: {
  amount: number
  achieved: boolean
  label: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border",
        achieved
          ? "bg-green-500/10 border-green-500/20"
          : "bg-muted/50 border-border"
      )}
    >
      <div
        className={cn(
          "rounded-full p-1.5",
          achieved ? "bg-green-500" : "bg-muted"
        )}
      >
        <Trophy
          className={cn(
            "h-3.5 w-3.5",
            achieved ? "text-white" : "text-muted-foreground"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            !achieved && "text-muted-foreground"
          )}
        >
          ${amount} {label}
        </p>
      </div>
      {achieved && (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
          Earned
        </Badge>
      )}
    </div>
  )
}
