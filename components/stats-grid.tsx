import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
} from "lucide-react"

const stats = [
  {
    label: "Resolved Issues",
    value: "1,247",
    change: "+12% this month",
    icon: CheckCircle2,
    iconBg: "bg-success/15",
    iconColor: "text-success",
  },
  {
    label: "Active Reports",
    value: "89",
    change: "23 dispatched",
    icon: Clock,
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
  },
  {
    label: "Critical Issues",
    value: "7",
    change: "Needs attention",
    icon: AlertTriangle,
    iconBg: "bg-destructive/15",
    iconColor: "text-destructive",
  },
  {
    label: "Active Citizens",
    value: "3,456",
    change: "+180 this week",
    icon: Users,
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </div>
            <p
              className="text-2xl font-bold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </div>
        )
      })}
    </div>
  )
}
