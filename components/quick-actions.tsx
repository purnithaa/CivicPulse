import Link from "next/link"
import {
  Construction,
  Lightbulb,
  Trash2,
  Droplets,
  TrafficCone,
  AlertTriangle,
} from "lucide-react"

const quickActions = [
  { label: "Pothole", icon: Construction, href: "/report?category=pothole", color: "bg-chart-3/15 text-chart-3" },
  { label: "Streetlight", icon: Lightbulb, href: "/report?category=streetlight", color: "bg-warning/15 text-warning" },
  { label: "Sanitation", icon: Trash2, href: "/report?category=sanitation", color: "bg-success/15 text-success" },
  { label: "Water", icon: Droplets, href: "/report?category=water", color: "bg-primary/15 text-primary" },
  { label: "Traffic", icon: TrafficCone, href: "/report?category=traffic", color: "bg-destructive/15 text-destructive" },
  { label: "Vandalism", icon: AlertTriangle, href: "/report?category=vandalism", color: "bg-chart-5/15 text-chart-5" },
]

export function QuickActions() {
  return (
    <div>
      <h2
        className="text-lg font-bold text-foreground"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Quick Report
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap a category to start reporting
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${action.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium text-foreground">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
