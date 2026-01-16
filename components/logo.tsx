"use client"

import { useState } from "react"
import Image from "next/image"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  priority?: boolean
}

// logo-full.png is 1559x722 (aspect ratio ~2.16:1)
// Sizes calculated to maintain proper aspect ratio
const sizes = {
  sm: { width: 86, height: 40, iconSize: "h-5 w-5", textSize: "text-lg", imgHeight: "h-7" },
  md: { width: 108, height: 50, iconSize: "h-6 w-6", textSize: "text-xl", imgHeight: "h-8" },
  lg: { width: 130, height: 60, iconSize: "h-7 w-7", textSize: "text-2xl", imgHeight: "h-9" },
}

export function Logo({ size = "md", className, priority = false }: LogoProps) {
  const [hasError, setHasError] = useState(false)
  const { width, height, iconSize, textSize, imgHeight } = sizes[size]

  if (hasError) {
    // Fallback: Text-based logo with icon
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center justify-center rounded-lg bg-primary p-1.5">
          <Zap className={cn(iconSize, "text-primary-foreground")} />
        </div>
        <span className={cn("font-bold tracking-tight", textSize)}>SubSense</span>
      </div>
    )
  }

  return (
    <Image
      src="/logo-full.png"
      alt="SubSense"
      width={width}
      height={height}
      className={cn(imgHeight, "w-auto", className)}
      priority={priority}
      onError={() => setHasError(true)}
    />
  )
}
