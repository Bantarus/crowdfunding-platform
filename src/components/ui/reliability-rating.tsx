"use client"

import { Star, StarHalf } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ReliabilityRatingProps {
  score: number
  className?: string
  showTooltip?: boolean
}

export function ReliabilityRating({ 
  score, 
  className,
  showTooltip = true 
}: ReliabilityRatingProps) {
  // Convert 0-100 score to 0-5 stars and decimal format
  const normalizedScore = Math.min(100, Math.max(0, score))
  const starScore = (normalizedScore / 100) * 5
  const fullStars = Math.floor(starScore)
  const hasHalfStar = starScore % 1 >= 0.5
  const decimalScore = (normalizedScore / 100 * 5).toFixed(1)

  const getColor = (score: number) => {
    if (score >= 75) return "text-green-500"
    if (score >= 50) return "text-blue-500"
    if (score >= 25) return "text-yellow-500"
    return "text-red-500"
  }

  const stars = Array(5).fill(0).map((_, i) => {
    if (i < fullStars) {
      return <Star key={i} className={cn("h-4 w-4 fill-current", getColor(normalizedScore))} />
    } else if (i === fullStars && hasHalfStar) {
      return <StarHalf key={i} className={cn("h-4 w-4", getColor(normalizedScore))} />
    }
    return <Star key={i} className="h-4 w-4 text-muted-foreground/20" />
  })

  const content = (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars}
      <span className={cn("ml-2 text-sm font-medium tabular-nums", getColor(normalizedScore))}>
        {decimalScore}
      </span>
    </div>
  )

  if (!showTooltip) return content

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p>Reliability Score: {decimalScore}/5.0</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 