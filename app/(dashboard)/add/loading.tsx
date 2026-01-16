"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form fields */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>

        {/* Preview Card Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <Skeleton className="h-16 w-20 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="flex justify-center">
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
