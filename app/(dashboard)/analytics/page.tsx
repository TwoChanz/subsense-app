"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Info, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { SpendingChart } from "@/components/analytics/spending-chart"
import { CategoryPieChart } from "@/components/analytics/category-pie-chart"
import { ROITrendChart } from "@/components/analytics/roi-trend-chart"
import { ComparisonCards } from "@/components/analytics/comparison-cards"
import { fetchAnalyticsSummary } from "@/lib/api"
import type { AnalyticsSummary, Insight } from "@/lib/analytics"
import { cn } from "@/lib/utils"

function InsightItem({ insight }: { insight: Insight }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        insight.type === "positive" && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
        insight.type === "negative" && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
        insight.type === "neutral" && "border-muted"
      )}
    >
      <div className="mt-0.5">
        {insight.type === "positive" && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
        {insight.type === "negative" && <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
        {insight.type === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-sm">{insight.message}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Comparison cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="mt-1 h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await fetchAnalyticsSummary()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!summary) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>No analytics data available. Add some subscriptions to get started.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Track your subscription spending and ROI trends</p>
        </div>
        <Button variant="outline" onClick={loadAnalytics} disabled={isLoading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Comparison Metric Cards */}
      <ComparisonCards data={summary.comparison} />

      {/* Insights */}
      {summary.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
            <CardDescription>Key observations about your subscriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summary.insights.map((insight, i) => (
                <InsightItem key={i} insight={insight} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending Trend - Full Width */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Monthly subscription spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingChart data={summary.spending} />
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>How your spending is distributed</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={summary.categories} />
          </CardContent>
        </Card>

        {/* ROI Health Trend */}
        <Card>
          <CardHeader>
            <CardTitle>ROI Health</CardTitle>
            <CardDescription>Subscription health distribution over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ROITrendChart data={summary.roiTrend} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
