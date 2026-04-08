import { cn } from "@/lib/utils"
import type { IssueStatus, IssuePriority } from "@/lib/mock-data"

export function StatusBadge({ status }: { status: IssueStatus }) {
  const config: Record<IssueStatus, { label: string; className: string }> = {
    submitted: {
      label: "Submitted",
      className: "bg-secondary text-secondary-foreground",
    },
    "in-review": {
      label: "In Review",
      className: "bg-primary/15 text-primary",
    },
    dispatched: {
      label: "Dispatched",
      className: "bg-warning/15 text-warning-foreground",
    },
    resolved: {
      label: "Resolved",
      className: "bg-success/15 text-success",
    },
  }

  const { label, className } = config[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
    >
      {label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  const config: Record<IssuePriority, { label: string; className: string }> = {
    low: {
      label: "Low",
      className: "bg-muted text-muted-foreground",
    },
    medium: {
      label: "Medium",
      className: "bg-primary/15 text-primary",
    },
    high: {
      label: "High",
      className: "bg-warning/15 text-warning-foreground",
    },
    critical: {
      label: "Critical",
      className: "bg-destructive/15 text-destructive",
    },
  }

  const { label, className } = config[priority]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
    >
      {label}
    </span>
  )
}
