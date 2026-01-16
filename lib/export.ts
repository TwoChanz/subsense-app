import type { Subscription } from "./types"

/**
 * Export subscriptions as CSV
 */
export function exportToCSV(subscriptions: Subscription[]): string {
  const headers = [
    "Name",
    "Category",
    "Monthly Cost",
    "Usage Frequency",
    "Importance",
    "ROI Score",
    "Status",
    "Created At",
  ]

  const rows = subscriptions.map((sub) => [
    `"${sub.name.replace(/"/g, '""')}"`,
    sub.category,
    sub.monthlyCost.toFixed(2),
    sub.usageFrequency,
    sub.importance,
    sub.roiScore.toString(),
    sub.status,
    sub.createdAt.toISOString().split("T")[0],
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

/**
 * Export subscriptions as JSON
 */
export function exportToJSON(subscriptions: Subscription[]): string {
  const data = subscriptions.map((sub) => ({
    name: sub.name,
    category: sub.category,
    monthlyCost: sub.monthlyCost,
    usageFrequency: sub.usageFrequency,
    importance: sub.importance,
    roiScore: sub.roiScore,
    status: sub.status,
    createdAt: sub.createdAt.toISOString(),
  }))

  return JSON.stringify(data, null, 2)
}

/**
 * Trigger a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export and download subscriptions
 */
export function downloadSubscriptions(
  subscriptions: Subscription[],
  format: "csv" | "json"
): void {
  const timestamp = new Date().toISOString().split("T")[0]

  if (format === "csv") {
    const content = exportToCSV(subscriptions)
    downloadFile(content, `subsense-export-${timestamp}.csv`, "text/csv;charset=utf-8;")
  } else {
    const content = exportToJSON(subscriptions)
    downloadFile(content, `subsense-export-${timestamp}.json`, "application/json")
  }
}
