"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Flame, Snowflake, AlertTriangle, Trophy, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  isAtRisk: boolean
  daysUntilExpiry: number | null
  streakFreezeAvailable: boolean
  onReview?: () => void
  onUseFreeze?: () => void
  compact?: boolean
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  isAtRisk,
  daysUntilExpiry,
  streakFreezeAvailable,
  onReview,
  onUseFreeze,
  compact = false,
}: StreakDisplayProps) {
  const isNewUser = currentStreak === 0 && longestStreak === 0

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-default",
                isAtRisk
                  ? "bg-amber-500/10 text-amber-500"
                  : currentStreak > 0
                  ? "bg-orange-500/10 text-orange-500"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Flame
                className={cn(
                  "h-4 w-4",
                  currentStreak > 0 && "animate-pulse"
                )}
              />
              <span>{currentStreak}-week streak</span>
              {isAtRisk && <AlertTriangle className="h-3 w-3" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Review Streak</p>
              <p className="text-xs text-muted-foreground">
                Complete a weekly subscription review to maintain your streak.
              </p>
              {isAtRisk && daysUntilExpiry && (
                <p className="text-xs text-amber-500">
                  {daysUntilExpiry} days left to maintain your streak!
                </p>
              )}
              {longestStreak > 0 && (
                <p className="text-xs">
                  Best streak: {longestStreak} weeks
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isAtRisk && "border-amber-500/50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-full p-2.5",
                currentStreak > 0
                  ? "bg-gradient-to-br from-orange-500 to-red-500"
                  : "bg-muted"
              )}
            >
              <Flame
                className={cn(
                  "h-5 w-5",
                  currentStreak > 0 ? "text-white" : "text-muted-foreground"
                )}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tabular-nums">
                  {currentStreak}
                </span>
                <span className="text-sm text-muted-foreground">
                  week{currentStreak !== 1 ? "s" : ""} streak
                </span>
                {isAtRisk && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    At Risk
                  </Badge>
                )}
              </div>

              {longestStreak > currentStreak && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Trophy className="h-3 w-3 text-yellow-500" />
                  Best: {longestStreak} weeks
                </p>
              )}

              {isAtRisk && daysUntilExpiry && (
                <p className="text-xs text-amber-500 mt-1">
                  {daysUntilExpiry} days left to save your streak
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {streakFreezeAvailable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={onUseFreeze}
                      disabled={!isAtRisk}
                    >
                      <Snowflake className="h-4 w-4 text-blue-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Streak Freeze Available</p>
                    <p className="text-xs text-muted-foreground">
                      Use to protect your streak (1/month)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {onReview && (
              <Button
                size="sm"
                variant={isAtRisk ? "default" : "outline"}
                onClick={onReview}
              >
                {isNewUser ? "Start Streak" : "Review Now"}
              </Button>
            )}
          </div>
        </div>

        {isNewUser && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Complete weekly subscription reviews to build your streak.
                Consistent reviews help you stay on top of your subscriptions
                and save money!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact inline version for header/stats row
export function StreakBadge({
  streak,
  isAtRisk,
}: {
  streak: number
  isAtRisk: boolean
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium",
        isAtRisk
          ? "bg-amber-500/10 text-amber-500"
          : streak > 0
          ? "bg-orange-500/10 text-orange-500"
          : "bg-muted text-muted-foreground"
      )}
    >
      <Flame className="h-3.5 w-3.5" />
      <span>{streak}</span>
    </div>
  )
}
