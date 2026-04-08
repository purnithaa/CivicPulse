"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  MapPin,
  Clock,
  ThumbsUp,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { categoryLabels, type Issue } from "@/lib/mock-data"
import { CategoryIcon } from "@/components/category-icon"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function IssueCard({ issue }: { issue: Issue }) {
  const [time, setTime] = useState("")

  useEffect(() => {
    setTime(timeAgo(issue.reportedAt))
  }, [issue.reportedAt])
  return (
    <Link href={`/my-reports#${issue.id}`}>
      <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CategoryIcon category={issue.category} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {issue.title}
                </h3>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {issue.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {issue.location}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {time || "Just now"}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {issue.upvotes}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  {categoryLabels[issue.category]}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
