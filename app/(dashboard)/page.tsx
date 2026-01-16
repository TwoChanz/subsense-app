"use client"

import { useState, useEffect } from "react"
import { MetricCard } from "@/components/metric-card"
import { SubscriptionTable } from "@/components/subscription-table"
import { getSubscriptions, calculateKPIs, deleteSubscription } from "@/lib/store"
import type { Subscription, KPIData } from "@/lib/types"
import { DollarSign, Package, AlertTriangle, Lightbulb } from "lucide-react"

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track and optimize your subscription ROI</p>
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
