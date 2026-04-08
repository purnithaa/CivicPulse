"use client"

import { useEffect, useState } from "react"
import { apiUrl } from "@/lib/api-base"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  monthlyTrend?: { month: string; reported: number; resolved: number }[]
  byDepartment?: Record<string, number>
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-1 text-center">
      <p className="text-sm font-medium text-muted-foreground">No data yet</p>
      <p className="text-xs text-muted-foreground/60">{label}</p>
    </div>
  )
}

export default function AnalyticsPage() {
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

  const resolutionRate =
    stats && stats.total > 0
      ? ((stats.resolved / stats.total) * 100).toFixed(1)
      : null

  const monthlyData =
    stats?.monthlyTrend?.some((m) => m.reported > 0 || m.resolved > 0)
      ? stats.monthlyTrend
      : []

  const departmentData =
    stats?.byDepartment && Object.keys(stats.byDepartment).length > 0
      ? Object.entries(stats.byDepartment)
          .map(([dept, count]) => ({ dept, count }))
          .sort((a, b) => b.count - a.count)
      : []

  const maxMonthly = Math.max(
    ...monthlyData.flatMap((d) => [d.reported, d.resolved]),
    1
  )
  const maxDept = Math.max(...departmentData.map((d) => d.count), 1)

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-foreground lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detailed performance metrics and trends
        </p>
      </div>

      <AdminCharts
        byCategory={stats?.byCategory}
        byStatus={stats?.byStatus}
        weeklyTrend={stats?.weeklyTrend}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Monthly trends — CSS bars */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Monthly Reports vs Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[200px] space-y-3">
              {loading ? (
                <EmptyState label="Loading..." />
              ) : monthlyData.length === 0 ? (
                <EmptyState label="Monthly trends will appear as issues are reported" />
              ) : (
                monthlyData.map((item) => (
                  <div key={item.month} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground">{item.month}</span>
                      <span className="text-muted-foreground">
                        {item.reported} reported / {item.resolved} resolved
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-2 flex-1 overflow-hidden rounded-l-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(item.reported / maxMonthly) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="h-2 flex-1 overflow-hidden rounded-r-full bg-muted">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(item.resolved / maxMonthly) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Issues by Department — CSS bars */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Issues by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[200px] space-y-3">
              {loading ? (
                <EmptyState label="Loading..." />
              ) : departmentData.length === 0 ? (
                <EmptyState label="Department breakdown will appear as issues are assigned" />
              ) : (
                departmentData.map((item) => (
                  <div key={item.dept} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground">{item.dept}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(item.count / maxDept) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Resolution Rate</p>
            <p className="mt-1 text-3xl font-bold text-success" style={{ fontFamily: "var(--font-heading)" }}>
              {loading ? "..." : resolutionRate !== null ? `${resolutionRate}%` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats
                ? stats.total > 0
                  ? `${stats.resolved} of ${stats.total} issues`
                  : "No issues yet"
                : "Loading..."}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Issues Today</p>
            <p className="mt-1 text-3xl font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
              {loading ? "..." : stats?.todayCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Reported today</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Critical Issues</p>
            <p className="mt-1 text-3xl font-bold text-destructive" style={{ fontFamily: "var(--font-heading)" }}>
              {loading ? "..." : stats?.critical ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Needs immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Issues</p>
            <p className="mt-1 text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              {loading ? "..." : stats?.total ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">All time reports</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
