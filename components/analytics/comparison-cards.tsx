"use client"

import { TrendingUp, TrendingDown, Minus, DollarSign, Hash, Target, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ComparisonData } from "@/lib/analytics"
import { formatCurrency } from "@/lib/analytics"
import { cn } from "@/lib/utils"

interface ComparisonCardsProps {
  data: ComparisonData
}

interface MetricCardProps {
  title: string
  value: string
  change: number
  changeLabel: string
  icon: React.ReactNode
  invertColors?: boolean
}

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  invertColors = false,
}: MetricCardProps) {
  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral = change === 0

  // For spending, positive change (increase) is bad
  // For other metrics, positive change is good
  const isGoodChange = invertColors ? isNegative : isPositive
  const isBadChange = invertColors ? isPositive : isNegative

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-muted p-2">{icon}</div>
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isGoodChange && "text-green-600 dark:text-green-400",
              isBadChange && "text-red-600 dark:text-red-400",
              isNeutral && "text-muted-foreground"
            )}
          >
            {isPositive && <TrendingUp className="h-4 w-4" />}
            {isNegative && <TrendingDown className="h-4 w-4" />}
            {isNeutral && <Minus className="h-4 w-4" />}
            <span>{changeLabel}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function ComparisonCards({ data }: ComparisonCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Monthly Spend"
        value={formatCurrency(data.totalSpend.current)}
        change={data.totalSpend.change}
        changeLabel={`${data.totalSpend.changePercent >= 0 ? "+" : ""}${data.totalSpend.changePercent}%`}
        icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        invertColors // For spending, decrease is good
      />
      <MetricCard
        title="Subscriptions"
        value={data.subscriptionCount.current.toString()}
        change={data.subscriptionCount.change}
        changeLabel={`${data.subscriptionCount.change >= 0 ? "+" : ""}${data.subscriptionCount.change}`}
        icon={<Hash className="h-5 w-5 text-muted-foreground" />}
      />
      <MetricCard
        title="Average ROI Score"
        value={data.averageROI.current.toString()}
        change={data.averageROI.change}
        changeLabel={`${data.averageROI.change >= 0 ? "+" : ""}${data.averageROI.change} pts`}
        icon={<Target className="h-5 w-5 text-muted-foreground" />}
      />
      <MetricCard
        title="Healthy Subscriptions"
        value={`${data.healthyPercent.current}%`}
        change={data.healthyPercent.change}
        changeLabel={`${data.healthyPercent.change >= 0 ? "+" : ""}${data.healthyPercent.change}%`}
        icon={<Heart className="h-5 w-5 text-muted-foreground" />}
      />
    </div>
  )
}
