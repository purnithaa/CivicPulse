import {
  Construction,
  Lightbulb,
  Trash2,
  Droplets,
  TrafficCone,
  AlertTriangle,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { IssueCategory } from "@/lib/mock-data"

const iconMap: Record<IssueCategory, { icon: React.ElementType; bgClass: string; iconClass: string }> = {
  pothole: { icon: Construction, bgClass: "bg-chart-3/15", iconClass: "text-chart-3" },
  streetlight: { icon: Lightbulb, bgClass: "bg-warning/15", iconClass: "text-warning" },
  sanitation: { icon: Trash2, bgClass: "bg-success/15", iconClass: "text-success" },
  water: { icon: Droplets, bgClass: "bg-primary/15", iconClass: "text-primary" },
  traffic: { icon: TrafficCone, bgClass: "bg-destructive/15", iconClass: "text-destructive" },
  vandalism: { icon: AlertTriangle, bgClass: "bg-chart-5/15", iconClass: "text-chart-5" },
  other: { icon: HelpCircle, bgClass: "bg-muted", iconClass: "text-muted-foreground" },
}

export function CategoryIcon({ category, size = "md" }: { category: IssueCategory; size?: "sm" | "md" | "lg" }) {
  const { icon: Icon, bgClass, iconClass } = iconMap[category]
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-lg", bgClass, sizeClasses[size])}>
      <Icon className={cn(iconSizes[size], iconClass)} />
    </div>
  )
}
