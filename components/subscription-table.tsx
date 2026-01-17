"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { ROIProgress } from "@/components/roi-progress"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import type { Subscription } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Eye, Pencil, Trash2, Package, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { ROITooltip } from "@/components/roi-tooltip"

interface SubscriptionTableProps {
  subscriptions: Subscription[]
  onDelete: (id: string) => void | Promise<void>
}

type SortField = "name" | "monthlyCost" | "roiScore" | "category"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE = 10

// Calculate days remaining for trial subscriptions
function getTrialDaysRemaining(trialEndDate: Date | null | undefined): number | null {
  if (!trialEndDate) return null
  const now = new Date()
  const end = new Date(trialEndDate)
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function SubscriptionTable({ subscriptions, onDelete }: SubscriptionTableProps) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("roiScore")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredAndSorted = subscriptions
    .filter(
      (sub) =>
        sub.name.toLowerCase().includes(search.toLowerCase()) ||
        sub.category.toLowerCase().includes(search.toLowerCase()) ||
        (sub.secondaryCategory && sub.secondaryCategory.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => {
      const modifier = sortDirection === "asc" ? 1 : -1
      if (sortField === "name" || sortField === "category") {
        return a[sortField].localeCompare(b[sortField]) * modifier
      }
      return (a[sortField] - b[sortField]) * modifier
    })

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedData = filteredAndSorted.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? (
      <ArrowUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="inline h-4 w-4 ml-1" />
    )
  }

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId)
      setDeleteId(null)
    }
  }

  const subscriptionToDelete = subscriptions.find((s) => s.id === deleteId)

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No subscriptions yet"
        description="Add your first subscription to start tracking your ROI and identify optimization opportunities."
        action={{
          label: "Add Subscription",
          onClick: () => (window.location.href = "/add"),
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={`${sortField}-${sortDirection}`}
          onValueChange={(value) => {
            const [field, direction] = value.split("-") as [SortField, SortDirection]
            setSortField(field)
            setSortDirection(direction)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roiScore-desc">ROI Score (High → Low)</SelectItem>
            <SelectItem value="roiScore-asc">ROI Score (Low → High)</SelectItem>
            <SelectItem value="monthlyCost-desc">Cost (High → Low)</SelectItem>
            <SelectItem value="monthlyCost-asc">Cost (Low → High)</SelectItem>
            <SelectItem value="name-asc">Name (A → Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z → A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                Name
                <SortIndicator field="name" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground hidden sm:table-cell"
                onClick={() => handleSort("category")}
              >
                Category
                <SortIndicator field="category" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground text-right"
                onClick={() => handleSort("monthlyCost")}
              >
                Cost/mo
                <SortIndicator field="monthlyCost" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-foreground hidden md:table-cell"
                onClick={() => handleSort("roiScore")}
              >
                <span className="inline-flex items-center gap-1">
                  ROI Score
                  <ROITooltip />
                  <SortIndicator field="roiScore" />
                </span>
              </TableHead>
              <TableHead className="hidden lg:table-cell">Status</TableHead>
              <TableHead className="w-[70px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{sub.name}</span>
                    {sub.billingCycle === "trial" && (
                      <>
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          <Clock className="h-3 w-3 mr-1" />
                          Trial
                        </Badge>
                        {(() => {
                          const daysLeft = getTrialDaysRemaining(sub.trialEndDate)
                          if (daysLeft === null) return null
                          const isUrgent = daysLeft <= 7
                          return (
                            <span className={`text-xs ${isUrgent ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                              {daysLeft <= 0 ? "Expired" : `${daysLeft}d left`}
                            </span>
                          )
                        })()}
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {sub.category}
                  {sub.secondaryCategory && (
                    <span className="text-xs opacity-70"> + {sub.secondaryCategory}</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">${sub.monthlyCost.toFixed(2)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <ROIProgress score={sub.roiScore} size="sm" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <StatusBadge status={sub.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/reports/${sub.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Report
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/add?edit=${sub.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(sub.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAndSorted.length === 0 && subscriptions.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">No subscriptions found matching your search.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSorted.length)} of {filteredAndSorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Subscription"
        description={`Are you sure you want to delete "${subscriptionToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
