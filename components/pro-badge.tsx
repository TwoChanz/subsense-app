import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProBadgeProps {
  className?: string
  size?: "sm" | "default"
}

export function ProBadge({ className, size = "default" }: ProBadgeProps) {
  return (
    <Badge
      className={cn(
        "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
        size === "sm" && "text-[10px] px-1.5 py-0",
        className
      )}
    >
      <Sparkles className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5")} />
      PRO
    </Badge>
  )
}

interface ProStatusBadgeProps {
  status: "FREE" | "ACTIVE" | "PAST_DUE" | "CANCELED"
  className?: string
}

export function ProStatusBadge({ status, className }: ProStatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge
          className={cn(
            "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
            className
          )}
        >
          <Sparkles className="h-3 w-3" />
          Pro Active
        </Badge>
      )
    case "PAST_DUE":
      return (
        <Badge variant="destructive" className={className}>
          Payment Past Due
        </Badge>
      )
    case "CANCELED":
      return (
        <Badge variant="secondary" className={className}>
          Pro Canceled
        </Badge>
      )
    case "FREE":
    default:
      return (
        <Badge variant="outline" className={className}>
          Free Plan
        </Badge>
      )
  }
}
