"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  BarChart3,
  Loader2,
} from "lucide-react"
import { AdminIssueTable } from "@/components/admin-issue-table"
import { apiUrl } from "@/lib/api-base"
import dynamic from "next/dynamic"

const AdminCharts = dynamic(
  () => import("@/components/admin-charts").then((m) => ({ default: m.AdminCharts })),
  { ssr: false }
)

interface LiveStats {
  total: number
  resolved: number
  inProgress: number
  critical: number
  submitted: number
  todayCount: number
  byCategory?: Record<string, number>
  byStatus?: Record<string, number>
  weeklyTrend?: { day: string; reports: number; resolved: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<LiveStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl("/api/stats"))
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const adminStats = [
    {
      label: "Total Reports",
      value: loading ? "..." : String(stats?.total ?? 0),
      change: stats ? `+${stats.todayCount} today` : "Loading...",
      icon: BarChart3,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
    },
    {
      label: "Resolved",
      value: loading ? "..." : String(stats?.resolved ?? 0),
      change: stats
        ? `${stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}% rate`
        : "Loading...",
      icon: CheckCircle2,
      iconBg: "bg-success/15",
      iconColor: "text-success",
    },
    {
      label: "In Progress",
      value: loading ? "..." : String(stats?.inProgress ?? 0),
      change: "Being handled",
      icon: Clock,
      iconBg: "bg-warning/15",
      iconColor: "text-warning",
    },
    {
      label: "Critical",
      value: loading ? "..." : String(stats?.critical ?? 0),
      change: "Needs attention",
      icon: AlertTriangle,
      iconBg: "bg-destructive/15",
      iconColor: "text-destructive",
    },
    {
      label: "Avg. Resolution",
      value: loading
        ? "..."
        : stats && stats.resolved > 0
        ? `${(stats.resolved / Math.max(stats.total, 1) * 100).toFixed(0)}%`
        : "—",
      change: stats && stats.resolved > 0 ? "Resolution rate" : "No data yet",
      icon: TrendingUp,
      iconBg: "bg-accent/15",
      iconColor: "text-accent",
    },
    {
      label: "Submitted",
      value: loading ? "..." : String(stats?.submitted ?? 0),
      change: "Awaiting review",
      icon: Users,
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-foreground lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of all urban issue reports and city operations
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {adminStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="p-4">
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
                  className="mt-2 text-2xl font-bold tracking-tight text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {loading && stat.value === "..." ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="mt-6">
        <AdminCharts
          byCategory={stats?.byCategory}
          byStatus={stats?.byStatus}
          weeklyTrend={stats?.weeklyTrend}
        />
      </div>

      {/* Issues table */}
      <div className="mt-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle
              className="text-lg font-bold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdminIssueTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
