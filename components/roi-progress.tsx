import { cn } from "@/lib/utils"

interface ROIProgressProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function ROIProgress({ score, size = "md", showLabel = true, className }: ROIProgressProps) {
  const getColorClass = (score: number) => {
    if (score >= 75) return "bg-[oklch(0.7_0.18_150)]"
    if (score >= 40) return "bg-[oklch(0.75_0.15_80)]"
    return "bg-[oklch(0.6_0.2_25)]"
  }

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex-1 rounded-full bg-muted overflow-hidden", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", getColorClass(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && <span className="text-sm font-medium tabular-nums w-8">{score}</span>}
    </div>
  )
}
