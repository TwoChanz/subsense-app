"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ActionItem } from "@/lib/types"
import {
  Zap,
  XCircle,
  TrendingDown,
  Clock,
  CalendarClock,
  Eye,
  MoreHorizontal,
  BellOff,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionQueueProps {
  actions: ActionItem[]
  onComplete: (actionId: string) => void
  onSnooze: (actionId: string, days: number) => void
  maxItems?: number
  showViewAll?: boolean
}

const actionTypeConfig: Record<
  ActionItem["type"],
  { icon: typeof Zap; color: string; bgColor: string }
> = {
  cancel: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  downgrade: {
    icon: TrendingDown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  review: {
    icon: Eye,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  trial_ending: {
    icon: Clock,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  renewal_reminder: {
    icon: CalendarClock,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
}

const priorityColors = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
}

export function ActionQueue({
  actions,
  onComplete,
  onSnooze,
  maxItems = 5,
  showViewAll = true,
}: ActionQueueProps) {
  const displayedActions = actions.slice(0, maxItems)
  const hasMore = actions.length > maxItems

  if (actions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" />
            Action Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-500/10 p-3 mb-3">
              <Zap className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No actions needed right now
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
            <Zap className="h-5 w-5 text-yellow-500" />
            Action Queue
            <Badge variant="secondary" className="ml-1">
              {actions.length}
            </Badge>
          </CardTitle>
          {showViewAll && hasMore && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/actions">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedActions.map((action) => (
          <ActionItem
            key={action.id}
            action={action}
            onComplete={onComplete}
            onSnooze={onSnooze}
          />
        ))}

        {hasMore && (
          <div className="pt-2 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/actions">
                View {actions.length - maxItems} more actions
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ActionItemProps {
  action: ActionItem
  onComplete: (actionId: string) => void
  onSnooze: (actionId: string, days: number) => void
}

function ActionItem({ action, onComplete, onSnooze }: ActionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = actionTypeConfig[action.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors hover:bg-muted/50",
        action.priority === "high" && "border-red-500/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("rounded-md p-2", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-sm truncate">{action.title}</h4>
            <Badge
              variant="outline"
              className={cn("text-xs", priorityColors[action.priority])}
            >
              {action.priority}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {action.description}
          </p>

          {action.potentialSavings && action.potentialSavings > 0 && (
            <p className="text-xs text-green-500 font-medium mt-1">
              Save ${action.potentialSavings.toFixed(2)}/mo
            </p>
          )}

          {action.dueDate && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Due: {formatDueDate(action.dueDate)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {action.type === "cancel" && (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs"
              onClick={() => onComplete(action.id)}
            >
              Cancel It
            </Button>
          )}
          {action.type === "review" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              asChild
            >
              <Link href={`/reports/${action.subscriptionId}`}>
                Review
              </Link>
            </Button>
          )}
          {action.type === "trial_ending" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              asChild
            >
              <Link href={`/reports/${action.subscriptionId}`}>
                Decide
              </Link>
            </Button>
          )}
          {action.type === "downgrade" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              How?
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSnooze(action.id, 7)}>
                <BellOff className="h-4 w-4 mr-2" />
                Snooze 1 week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSnooze(action.id, 30)}>
                <BellOff className="h-4 w-4 mr-2" />
                Snooze 1 month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onComplete(action.id)}>
                <XCircle className="h-4 w-4 mr-2" />
                Dismiss
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/reports/${action.subscriptionId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isExpanded && action.type === "downgrade" && (
        <div className="mt-3 pt-3 border-t text-sm">
          <p className="text-muted-foreground">{action.description}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onComplete(action.id)}>
              Done
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsExpanded(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDueDate(date: Date): string {
  const now = new Date()
  const dueDate = new Date(date)
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return "Overdue"
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays <= 7) return `${diffDays} days`

  return dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
