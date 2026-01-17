"use client"

// Force dynamic rendering to avoid build-time prerender issues with Clerk auth
export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SavingsReportCard, generateSavingsReport } from "@/components/savings-report"
import { fetchSubscriptions } from "@/lib/api"
import { getUserData } from "@/lib/user-store"
import type { Subscription, SavingsReport, UserData } from "@/lib/types"
import {
  BarChart3,
  PiggyBank,
  Download,
  Share2,
  Calendar,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reportPeriod, setReportPeriod] = useState<"monthly" | "annual">("monthly")

  const loadData = useCallback(async () => {
    try {
      const subs = await fetchSubscriptions()
      setSubscriptions(subs)
      const user = getUserData()
      setUserData(user)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const report = userData
    ? generateSavingsReport(
        subscriptions.map((s) => ({
          name: s.name,
          monthlyCost: s.monthlyCost,
          roiScore: s.roiScore,
          status: s.status,
        })),
        userData.savings,
        reportPeriod
      )
    : null

  const handleShare = (platform: "twitter" | "linkedin" | "copy") => {
    toast.success(`${platform === "copy" ? "Copied to clipboard" : `Shared to ${platform}`}`)
  }

  const handleDownload = () => {
    if (!report) return

    const data = {
      report,
      generatedAt: new Date().toISOString(),
      subscriptions: subscriptions.map((s) => ({
        name: s.name,
        category: s.category,
        monthlyCost: s.monthlyCost,
        roiScore: s.roiScore,
        status: s.status,
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `subsense-report-${reportPeriod}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Report downloaded")
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            View your savings progress and shareable summaries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!report}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Tabs */}
      <Tabs value={reportPeriod} onValueChange={(v) => setReportPeriod(v as "monthly" | "annual")}>
        <TabsList>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="annual" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Annual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Savings Report Card */}
            {report && (
              <SavingsReportCard
                report={report}
                onShare={handleShare}
                onDownload={handleDownload}
              />
            )}

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    This Month's Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">
                        {userData?.savings.subscriptionsCanceled ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Subscriptions canceled</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">
                        {userData?.savings.subscriptionsDowngraded ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Subscriptions downgraded</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">
                        {userData?.streaks.currentStreak ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Week review streak</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">
                        {userData?.badges.length ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Badges earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badges */}
              {userData && userData.badges.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Badges Earned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {userData.badges.map((badge) => (
                        <div
                          key={badge.type}
                          className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                        >
                          <div className="rounded-full bg-green-500 p-1">
                            <PiggyBank className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {badge.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="annual" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Annual Savings Report */}
            {report && (
              <SavingsReportCard
                report={report}
                onShare={handleShare}
                onDownload={handleDownload}
              />
            )}

            {/* Year Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Annual Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-green-500">
                    ${userData?.savings.totalSavedThisYear.toFixed(0) ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total saved this year
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xl font-semibold">
                      ${userData?.savings.totalSavedAllTime.toFixed(0) ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">All-time savings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold">
                      {userData?.streaks.longestStreak ?? 0} weeks
                    </p>
                    <p className="text-xs text-muted-foreground">Longest streak</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Keep reviewing your subscriptions to maximize your savings!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
