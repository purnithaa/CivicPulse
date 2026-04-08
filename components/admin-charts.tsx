"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const STATUS_COLORS: Record<string, string> = {
  submitted: "var(--color-muted-foreground)",
  "in-review": "var(--color-primary)",
  dispatched: "var(--color-warning)",
  resolved: "var(--color-success)",
}

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  "in-review": "In Review",
  dispatched: "Dispatched",
  resolved: "Resolved",
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-1 text-center">
      <p className="text-sm font-medium text-muted-foreground">No data yet</p>
      <p className="text-xs text-muted-foreground/60">{label}</p>
    </div>
  )
}

interface AdminChartsProps {
  byCategory?: Record<string, number>
  byStatus?: Record<string, number>
  weeklyTrend?: { day: string; reports: number; resolved: number }[]
}

export function AdminCharts({ byCategory, byStatus, weeklyTrend }: AdminChartsProps) {
  const categoryData =
    byCategory && Object.keys(byCategory).length > 0
      ? Object.entries(byCategory)
          .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
      : []

  const statusData =
    byStatus && Object.values(byStatus).some((v) => v > 0)
      ? Object.entries(byStatus)
          .filter(([, value]) => value > 0)
          .map(([key, value]) => ({
            name: STATUS_LABELS[key] ?? key,
            value,
            fill: STATUS_COLORS[key] ?? "var(--color-primary)",
          }))
      : []

  const trendData =
    weeklyTrend && weeklyTrend.some((d) => d.reports > 0 || d.resolved > 0)
      ? weeklyTrend
      : []

  const maxCategory = Math.max(...categoryData.map((d) => d.count), 1)
  const maxTrend = Math.max(
    ...trendData.flatMap((d) => [d.reports, d.resolved]),
    1
  )

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Issues by Category — CSS bars */}
      <Card className="border-border bg-card lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Issues by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] space-y-3">
            {categoryData.length === 0 ? (
              <EmptyState label="Issues will appear here once reported" />
            ) : (
              categoryData.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(item.count / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend — CSS bars */}
      <Card className="border-border bg-card lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Weekly Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] space-y-3">
            {trendData.length === 0 ? (
              <EmptyState label="Weekly activity will show here" />
            ) : (
              trendData.map((item) => (
                <div key={item.day} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground">{item.day}</span>
                    <span className="text-muted-foreground">
                      {item.reports} reports / {item.resolved} resolved
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-l-full bg-muted"
                      title="Reports"
                    >
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(item.reports / maxTrend) * 100}%`,
                        }}
                      />
                    </div>
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-r-full bg-muted"
                      title="Resolved"
                    >
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(item.resolved / maxTrend) * 100}%`,
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

      {/* Status Distribution — simple list */}
      <Card className="border-border bg-card lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px]">
            {statusData.length === 0 ? (
              <EmptyState label="Status breakdown will appear here" />
            ) : (
              <div className="space-y-2">
                {statusData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-md border border-border p-2"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="flex-1 pl-2 text-sm text-foreground">
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
