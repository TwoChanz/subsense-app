import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { SubscriptionStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: SubscriptionStatus
  className?: string
}

const statusConfig: Record<SubscriptionStatus, { label: string; className: string }> = {
  good: {
    label: "Good",
    className: "bg-[oklch(0.7_0.18_150/0.15)] text-[oklch(0.7_0.18_150)] border-[oklch(0.7_0.18_150/0.3)]",
  },
  review: {
    label: "Review",
    className: "bg-[oklch(0.75_0.15_80/0.15)] text-[oklch(0.75_0.15_80)] border-[oklch(0.75_0.15_80/0.3)]",
  },
  cut: {
    label: "Cut",
    className: "bg-[oklch(0.6_0.2_25/0.15)] text-[oklch(0.6_0.2_25)] border-[oklch(0.6_0.2_25/0.3)]",
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
