"use client"

// Force dynamic rendering to avoid build-time prerender issues with Clerk auth
export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from "react"
import { MetricCard } from "@/components/metric-card"
import { SubscriptionTable } from "@/components/subscription-table"
import { ActionQueue } from "@/components/action-queue"
import { StreakDisplay, StreakBadge } from "@/components/streak-display"
import { SavingsSummary } from "@/components/savings-summary"
import { RenewalCalendar } from "@/components/renewal-calendar"
import { TrialTracker } from "@/components/trial-tracker"
import { SubscriptionHealth } from "@/components/subscription-health"
import { ShareableSavingsCard, useShareSavings } from "@/components/shareable-savings-card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchSubscriptions, fetchKPIs, deleteSubscription as apiDeleteSubscription } from "@/lib/api"
import { downloadSubscriptions } from "@/lib/export"
import { generateActionItems, calculatePotentialSavings } from "@/lib/actions"
import {
  getUserData,
  recordReviewCompletion,
  recordSavings,
  completeAction,
  snoozeAction,
  getStreakStatus,
} from "@/lib/user-store"
import type { Subscription, KPIData, ActionItem, UserData } from "@/lib/types"
import {
  DollarSign,
  Package,
  AlertTriangle,
  Lightbulb,
  Download,
  FileSpreadsheet,
  FileJson,
  Zap,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [actions, setActions] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const { isOpen: shareOpen, setIsOpen: setShareOpen, openShareDialog } = useShareSavings()

  // Prevent hydration mismatch with Radix UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [subs, kpiData] = await Promise.all([
        fetchSubscriptions(),
        fetchKPIs(),
      ])
      setSubscriptions(subs)
      setKpis(kpiData)

      // Generate action items
      const actionItems = generateActionItems(subs)
      setActions(actionItems)

      // Load user data
      const user = getUserData()
      setUserData(user)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load data", {
        description: "Please try refreshing the page.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async (id: string) => {
    const sub = subscriptions.find((s) => s.id === id)
    try {
      await apiDeleteSubscription(id)
      // Record savings if it was a subscription marked for cutting
      if (sub && sub.status === "cut") {
        recordSavings(sub.monthlyCost, "cancel")
        setUserData(getUserData())
      }
      // Reload data after delete
      loadData()
      toast.success("Subscription deleted", {
        description: sub?.name ? `${sub.name} has been removed.` : undefined,
      })
    } catch (error) {
      console.error("Failed to delete subscription:", error)
      toast.error("Failed to delete subscription")
    }
  }

  const handleExport = (format: "csv" | "json") => {
    if (subscriptions.length === 0) {
      toast.error("No data to export", {
        description: "Add some subscriptions first before exporting.",
      })
      return
    }
    downloadSubscriptions(subscriptions, format)
    toast.success(`Exported as ${format.toUpperCase()}`, {
      description: `${subscriptions.length} subscriptions exported successfully.`,
    })
  }

  const handleCompleteAction = (actionId: string) => {
    completeAction(actionId)
    const updatedActions = actions.filter((a) => a.id !== actionId)
    setActions(updatedActions)
    setUserData(getUserData())
    toast.success("Action completed")
  }

  const handleSnoozeAction = (actionId: string, days: number) => {
    const until = new Date()
    until.setDate(until.getDate() + days)
    snoozeAction(actionId, until)
    const updatedActions = actions.filter((a) => a.id !== actionId)
    setActions(updatedActions)
    toast.success(`Snoozed for ${days} day${days !== 1 ? "s" : ""}`)
  }

  const handleReview = () => {
    recordReviewCompletion()
    setUserData(getUserData())
    toast.success("Review completed!", {
      description: "Your streak has been updated.",
    })
  }

  const streakStatus = userData ? getStreakStatus() : { current: 0, isAtRisk: false, daysUntilExpiry: null }
  const potentialSavings = calculatePotentialSavings(actions)

  return (
    <div className="space-y-6">
      {/* Header with streak and savings */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track and optimize your subscription ROI</p>
        </div>
        <div className="flex items-center gap-3">
          {mounted && userData && (
            <>
              <StreakBadge streak={streakStatus.current} isAtRisk={streakStatus.isAtRisk} />
              <SavingsSummary savings={userData.savings} variant="compact" />
            </>
          )}
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isLoading || subscriptions.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Spend"
          value={kpis ? `$${kpis.totalMonthlySpend.toFixed(0)}` : "$0"}
          description="across all subscriptions"
          icon={DollarSign}
          isLoading={isLoading}
        />
        <MetricCard
          title="Subscriptions"
          value={kpis?.subscriptionCount ?? 0}
          description="active subscriptions"
          icon={Package}
          isLoading={isLoading}
        />
        <MetricCard
          title="Potential Savings"
          value={`$${potentialSavings.monthly.toFixed(0)}/mo`}
          description={`$${potentialSavings.annual.toFixed(0)}/year if you act`}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <MetricCard
          title="Action Items"
          value={actions.length}
          description={actions.length > 0 ? "items need attention" : "all caught up!"}
          icon={actions.length > 0 ? AlertTriangle : Lightbulb}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Action-First Layout */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Queue - Primary focus */}
              <ActionQueue
                actions={actions}
                onComplete={handleCompleteAction}
                onSnooze={handleSnoozeAction}
                maxItems={5}
              />

              {/* Renewal Calendar */}
              <RenewalCalendar subscriptions={subscriptions} daysAhead={7} maxItems={5} />
            </div>

            {/* Right Column - Status & Engagement */}
            <div className="space-y-6">
              {/* Streak Display */}
              {mounted && userData && (
                <StreakDisplay
                  currentStreak={streakStatus.current}
                  longestStreak={userData.streaks.longestStreak}
                  isAtRisk={streakStatus.isAtRisk}
                  daysUntilExpiry={streakStatus.daysUntilExpiry}
                  streakFreezeAvailable={userData.streaks.streakFreezeAvailable}
                  onReview={handleReview}
                />
              )}

              {/* Trial Tracker */}
              <TrialTracker
                subscriptions={subscriptions}
                onCancel={(id) => handleDelete(id)}
                maxItems={3}
              />

              {/* Subscription Health */}
              <SubscriptionHealth subscriptions={subscriptions} />
            </div>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Subscriptions</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <SubscriptionTable subscriptions={subscriptions} onDelete={handleDelete} />
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Savings Summary */}
            {mounted && userData && (
              <SavingsSummary savings={userData.savings} onShare={openShareDialog} />
            )}

            {/* Subscription Health */}
            <SubscriptionHealth subscriptions={subscriptions} showViewAll={false} />

            {/* Category Breakdown (placeholder for future) */}
            <div className="lg:col-span-2">
              <MetricCard
                title="Estimated Annual Waste"
                value={kpis ? `$${(kpis.estimatedWaste * 12).toFixed(0)}` : "$0"}
                description={`Based on ${kpis?.optimizationOpportunities ?? 0} subscriptions marked for review or cutting`}
                icon={AlertTriangle}
                isLoading={isLoading}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      {mounted && userData && (
        <ShareableSavingsCard
          open={shareOpen}
          onOpenChange={setShareOpen}
          savings={userData.savings}
          streak={streakStatus.current}
          subscriptionCount={kpis?.subscriptionCount ?? 0}
        />
      )}
    </div>
  )
}
