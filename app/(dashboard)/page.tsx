"use client"

import { useState, useEffect } from "react"
import { MetricCard } from "@/components/metric-card"
import { SubscriptionTable } from "@/components/subscription-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSubscriptions, calculateKPIs, deleteSubscription } from "@/lib/store"
import { downloadSubscriptions } from "@/lib/export"
import type { Subscription, KPIData } from "@/lib/types"
import { DollarSign, Package, AlertTriangle, Lightbulb, Download, FileSpreadsheet, FileJson } from "lucide-react"
import { toast } from "sonner"

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch with Radix UI
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setSubscriptions(getSubscriptions())
      setKpis(calculateKPIs())
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleDelete = (id: string) => {
    deleteSubscription(id)
    setSubscriptions(getSubscriptions())
    setKpis(calculateKPIs())
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track and optimize your subscription ROI</p>
        </div>
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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Monthly Spend"
          value={kpis ? `$${kpis.totalMonthlySpend.toFixed(2)}` : "$0"}
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
          title="Estimated Waste"
          value={kpis ? `$${kpis.estimatedWaste.toFixed(2)}` : "$0"}
          description="potential monthly savings"
          icon={AlertTriangle}
          isLoading={isLoading}
        />
        <MetricCard
          title="Opportunities"
          value={kpis?.optimizationOpportunities ?? 0}
          description="subscriptions to review"
          icon={Lightbulb}
          isLoading={isLoading}
        />
      </div>

      {/* Subscriptions Table */}
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
    </div>
  )
}
