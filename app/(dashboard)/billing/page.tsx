"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchInvoices, InvoiceItem } from "@/lib/api"
import { createPortalSession } from "@/lib/stripe-client"
import { ProStatusBadge } from "@/components/pro-badge"
import { toast } from "sonner"
import { CreditCard, Download, ExternalLink, FileText, Loader2, Receipt } from "lucide-react"
import type { ProStatus } from "@/lib/pro"

interface UserProStatus {
  isPro: boolean
  proStatus: ProStatus
  stripeCurrentPeriodEnd: string | null
}

function BillingContent() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userProStatus, setUserProStatus] = useState<UserProStatus | null>(null)
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [invoiceData, statusResponse] = await Promise.all([
        fetchInvoices(),
        fetch("/api/user/status").then((res) => res.json()),
      ])
      setInvoices(invoiceData)

      if (statusResponse.proStatus) {
        setUserProStatus(statusResponse.proStatus)
      }

      // Redirect non-Pro users to settings
      if (!statusResponse.proStatus?.isPro) {
        router.push("/settings")
        return
      }
    } catch (error) {
      console.error("Failed to load billing data:", error)
      toast.error("Failed to load billing data")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleManageSubscription = async () => {
    setIsPortalLoading(true)
    try {
      const portalUrl = await createPortalSession()
      if (portalUrl) {
        window.location.href = portalUrl
      }
    } catch (error) {
      console.error("Portal error:", error)
      toast.error("Failed to open billing portal", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsPortalLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Paid</Badge>
      case "open":
        return <Badge variant="default" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Open</Badge>
      case "void":
        return <Badge variant="secondary">Void</Badge>
      case "uncollectible":
        return <Badge variant="destructive">Uncollectible</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>
    }
  }

  const proStatus = userProStatus?.proStatus ?? "FREE"

  if (isLoading) {
    return <BillingPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and view invoice history</p>
      </div>

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current plan and billing details</CardDescription>
            </div>
            <ProStatusBadge status={proStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-lg font-semibold">SubSense Pro</p>
              <p className="text-sm text-muted-foreground">$4.99/month</p>
              {userProStatus?.stripeCurrentPeriodEnd && (
                <p className="text-xs text-muted-foreground">
                  {proStatus === "CANCELED" ? "Access until " : "Renews "}
                  {new Date(userProStatus.stripeCurrentPeriodEnd).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
            >
              {isPortalLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscription
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice History
              </CardTitle>
              <CardDescription>Your past invoices and payment records</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoices yet</p>
              <p className="text-sm">Your invoices will appear here after your first billing cycle</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.number || invoice.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>{formatDate(invoice.created)}</TableCell>
                    <TableCell>{formatCurrency(invoice.amountPaid || invoice.amountDue, invoice.currency)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.hostedInvoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </a>
                          </Button>
                        )}
                        {invoice.invoicePdf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download PDF</span>
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingContent />
    </Suspense>
  )
}

function BillingPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-24 bg-muted animate-pulse rounded" />
        <div className="h-5 w-64 bg-muted animate-pulse rounded mt-1" />
      </div>
      <div className="rounded-lg border p-6">
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      </div>
      <div className="rounded-lg border p-6">
        <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
