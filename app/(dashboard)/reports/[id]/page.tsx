"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROIProgress } from "@/components/roi-progress"
import { StatusBadge } from "@/components/status-badge"
import { ROITooltip } from "@/components/roi-tooltip"
import { getSubscriptionById } from "@/lib/store"
import { generateCategoryBreakdown, getRecommendation } from "@/lib/scoring"
import type { Subscription } from "@/lib/types"
import {
  ArrowLeft,
  Activity,
  DollarSign,
  Shield,
  Clock,
  CheckCircle2,
  ArrowDownCircle,
  XCircle,
  Pencil,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const sub = getSubscriptionById(id)
    setSubscription(sub ?? null)
    setIsLoading(false)
  }, [id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Not Found</h1>
            <p className="text-muted-foreground mt-1">This subscription could not be found.</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const breakdown = generateCategoryBreakdown(
    subscription.usageFrequency,
    subscription.importance,
    subscription.monthlyCost,
  )

  const recommendation = getRecommendation(subscription.roiScore)

  const insights = [
    subscription.usageFrequency === "daily"
      ? "You use this service every day, indicating high dependency."
      : subscription.usageFrequency === "weekly"
        ? "Weekly usage suggests moderate but consistent value."
        : subscription.usageFrequency === "monthly"
          ? "Monthly usage may indicate underutilization."
          : "Rare usage suggests this subscription may not be necessary.",
    subscription.importance === "high"
      ? "Marked as essential for your work or productivity."
      : subscription.importance === "medium"
        ? "Provides useful features but alternatives may exist."
        : "Nice-to-have but not critical for your workflow.",
    subscription.monthlyCost > 30
      ? "Higher cost subscription - ensure value matches the price."
      : subscription.monthlyCost > 15
        ? "Mid-range pricing - typical for professional tools."
        : "Cost-effective subscription with good price point.",
    subscription.roiScore >= 75
      ? "Strong ROI score indicates this is a valuable investment."
      : subscription.roiScore >= 40
        ? "Moderate ROI - consider optimizing or downgrading."
        : "Low ROI suggests this subscription may be wasteful.",
  ]

  const categoryCards = [
    {
      title: "Usage Value",
      value: breakdown.usageValue,
      icon: Activity,
      description: "How much value you get from actual usage",
    },
    {
      title: "Cost Efficiency",
      value: breakdown.costEfficiency,
      icon: DollarSign,
      description: "Value relative to the monthly cost",
    },
    {
      title: "Replacement Risk",
      value: breakdown.replacementRisk,
      icon: Shield,
      description: "Difficulty of finding alternatives",
    },
    {
      title: "Cancellation Friction",
      value: breakdown.cancellationFriction,
      icon: Clock,
      description: "Effort required to cancel or switch",
    },
  ]

  const recommendationConfig = {
    keep: {
      icon: CheckCircle2,
      label: "Keep",
      description: "This subscription provides excellent value. Continue using it.",
      className: "text-green-600 dark:text-green-400 bg-green-500/10",
    },
    downgrade: {
      icon: ArrowDownCircle,
      label: "Consider Downgrade",
      description: "Look for a cheaper plan or alternative that meets your needs.",
      className: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10",
    },
    cancel: {
      icon: XCircle,
      label: "Cancel",
      description: "This subscription doesn't provide enough value. Consider canceling.",
      className: "text-red-600 dark:text-red-400 bg-red-500/10",
    },
  }

  const recConfig = recommendationConfig[recommendation]
  const RecIcon = recConfig.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to dashboard</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{subscription.name}</h1>
              <StatusBadge status={subscription.status} />
            </div>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {subscription.category} • ${subscription.monthlyCost.toFixed(2)}/month
            </p>
          </div>
        </div>
        <Button variant="outline" asChild className="self-start sm:self-auto">
          <Link href={`/add?edit=${subscription.id}`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      {/* ROI Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ROI Score
            <ROITooltip />
          </CardTitle>
          <CardDescription>Overall return on investment analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="text-center md:text-left">
              <div className="text-7xl font-bold">{subscription.roiScore}</div>
              <p className="text-muted-foreground">out of 100</p>
            </div>
            <div className="flex-1">
              <ROIProgress score={subscription.roiScore} size="lg" showLabel={false} />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Poor</span>
                <span>Review</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categoryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <ROIProgress score={card.value} size="sm" showLabel={false} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Insights</CardTitle>
            <CardDescription>Key observations about this subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.map((insight, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-muted-foreground">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendation</CardTitle>
            <CardDescription>Our suggested action for this subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg p-6 ${recConfig.className}`}>
              <div className="flex items-center gap-3 mb-3">
                <RecIcon className="h-6 w-6" />
                <span className="text-xl font-semibold">{recConfig.label}</span>
              </div>
              <p className="text-sm opacity-90">{recConfig.description}</p>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href={`/add?edit=${subscription.id}`}>Review Details</Link>
              </Button>
              <Button variant="outline" asChild className="sm:flex-initial">
                <Link href="/">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
