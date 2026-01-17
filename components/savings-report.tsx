"use client"

import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { SavingsReport } from "@/lib/types"
import {
  Share2,
  Download,
  Twitter,
  Linkedin,
  PiggyBank,
  TrendingUp,
  XCircle,
  TrendingDown,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface SavingsReportCardProps {
  report: SavingsReport
  onShare?: (platform: "twitter" | "linkedin" | "copy") => void
  onDownload?: () => void
  variant?: "full" | "compact"
}

export function SavingsReportCard({
  report,
  onShare,
  onDownload,
  variant = "full",
}: SavingsReportCardProps) {
  const [copied, setCopied] = useState(false)

  const periodLabel =
    report.period === "monthly"
      ? new Date(report.periodStart).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : new Date(report.periodStart).getFullYear().toString()

  const handleCopy = () => {
    const text = generateShareText(report)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onShare?.("copy")
  }

  const handleTwitterShare = () => {
    const text = generateShareText(report)
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
    onShare?.("twitter")
  }

  const handleLinkedInShare = () => {
    const text = generateShareText(report)
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.origin
    )}&summary=${encodeURIComponent(text)}`
    window.open(url, "_blank")
    onShare?.("linkedin")
  }

  if (variant === "compact") {
    return (
      <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-green-500" />
            <span className="font-medium">{periodLabel} Summary</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-green-500">
            ${report.totalSaved.toFixed(0)}
          </span>
          <span className="text-sm text-muted-foreground">saved</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {report.subscriptionsCanceled} canceled &middot;{" "}
          {report.subscriptionsDowngraded} downgraded
        </p>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
            {report.period === "monthly" ? "Monthly Report" : "Annual Report"}
          </Badge>
          <span className="text-sm text-white/80">{periodLabel}</span>
        </div>

        <div className="text-center">
          <p className="text-white/80 text-sm mb-1">Total Saved</p>
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="h-8 w-8" />
            <span className="text-5xl font-bold">${report.totalSaved.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatBox
            icon={XCircle}
            label="Canceled"
            value={report.subscriptionsCanceled}
            iconColor="text-red-500"
          />
          <StatBox
            icon={TrendingDown}
            label="Downgraded"
            value={report.subscriptionsDowngraded}
            iconColor="text-amber-500"
          />
          <StatBox
            icon={BarChart3}
            label="Total Subs"
            value={report.totalSubscriptions}
            iconColor="text-blue-500"
          />
          <StatBox
            icon={PiggyBank}
            label="Monthly Spend"
            value={`$${report.totalMonthlySpend.toFixed(0)}`}
            iconColor="text-purple-500"
          />
        </div>

        {/* Health breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Subscription Health</h4>
          <div className="flex gap-2">
            <HealthPill
              label="Good"
              count={report.healthBreakdown.good}
              color="green"
            />
            <HealthPill
              label="Review"
              count={report.healthBreakdown.review}
              color="amber"
            />
            <HealthPill
              label="Cut"
              count={report.healthBreakdown.cut}
              color="red"
            />
          </div>
        </div>

        {/* Average ROI */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <span className="text-sm text-muted-foreground">Average ROI Score</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{report.averageROIScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Top canceled services */}
        {report.topCancelledServices.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Services Optimized</h4>
            <div className="flex flex-wrap gap-2">
              {report.topCancelledServices.map((service) => (
                <Badge key={service} variant="outline" className="text-xs">
                  <Scissors className="h-3 w-3 mr-1" />
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleTwitterShare}
          >
            <Twitter className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleLinkedInShare}
          >
            <Linkedin className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {onDownload && (
            <Button variant="outline" size="icon" onClick={onDownload}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Branding footer */}
        <p className="text-xs text-center text-muted-foreground">
          Generated with SubSense &middot; subsense.app
        </p>
      </CardContent>
    </Card>
  )
}

function StatBox({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: typeof PiggyBank
  label: string
  value: number | string
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className={cn("h-5 w-5", iconColor)} />
      <div>
        <p className="text-lg font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function HealthPill({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: "green" | "amber" | "red"
}) {
  const colorClasses = {
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  return (
    <div
      className={cn(
        "flex-1 text-center py-2 px-3 rounded-lg border",
        colorClasses[color]
      )}
    >
      <p className="text-lg font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}

function generateShareText(report: SavingsReport): string {
  const periodLabel =
    report.period === "monthly"
      ? new Date(report.periodStart).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : new Date(report.periodStart).getFullYear().toString()

  return `I saved $${report.totalSaved.toFixed(0)} on subscriptions in ${periodLabel} using SubSense!

Canceled ${report.subscriptionsCanceled} subscriptions
Average ROI score: ${report.averageROIScore}/100

Track your subscription ROI at subsense.app`
}

// Helper to generate a report from current data
export function generateSavingsReport(
  subscriptions: Array<{
    name: string
    monthlyCost: number
    roiScore: number
    status: "good" | "review" | "cut"
  }>,
  savingsData: {
    totalSavedThisMonth: number
    totalSavedThisYear: number
    subscriptionsCanceled: number
    subscriptionsDowngraded: number
  },
  period: "monthly" | "annual" = "monthly"
): SavingsReport {
  const now = new Date()
  let periodStart: Date
  let periodEnd: Date

  if (period === "monthly") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  } else {
    periodStart = new Date(now.getFullYear(), 0, 1)
    periodEnd = new Date(now.getFullYear(), 11, 31)
  }

  const totalMonthlySpend = subscriptions.reduce((sum, sub) => sum + sub.monthlyCost, 0)
  const averageROIScore = Math.round(
    subscriptions.reduce((sum, sub) => sum + sub.roiScore, 0) / subscriptions.length || 0
  )

  const healthBreakdown = {
    good: subscriptions.filter((s) => s.status === "good").length,
    review: subscriptions.filter((s) => s.status === "review").length,
    cut: subscriptions.filter((s) => s.status === "cut").length,
  }

  return {
    generatedAt: now,
    period,
    periodStart,
    periodEnd,
    totalSubscriptions: subscriptions.length,
    totalMonthlySpend,
    totalSaved: period === "monthly" ? savingsData.totalSavedThisMonth : savingsData.totalSavedThisYear,
    subscriptionsCanceled: savingsData.subscriptionsCanceled,
    subscriptionsDowngraded: savingsData.subscriptionsDowngraded,
    topCancelledServices: [], // Would need to track this separately
    averageROIScore,
    healthBreakdown,
  }
}
