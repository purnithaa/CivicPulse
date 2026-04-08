import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("issues")
      .select("id, status, priority, reported_at, category, department")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const issues = data ?? []
    const total = issues.length
    const resolved = issues.filter((i) => i.status === "resolved").length
    const inProgress = issues.filter(
      (i) => i.status === "dispatched" || i.status === "in-review"
    ).length
    const critical = issues.filter((i) => i.priority === "critical").length
    const submitted = issues.filter((i) => i.status === "submitted").length

    // Issues today
    const today = new Date().toISOString().split("T")[0]
    const todayCount = issues.filter((i) =>
      i.reported_at?.startsWith(today)
    ).length

    // Category breakdown
    const byCategory: Record<string, number> = {}
    for (const issue of issues) {
      if (issue.category) {
        byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1
      }
    }

    // Status breakdown
    const byStatus: Record<string, number> = {
      submitted,
      "in-review": issues.filter((i) => i.status === "in-review").length,
      dispatched: issues.filter((i) => i.status === "dispatched").length,
      resolved,
    }

    // Weekly trend (last 7 days)
    const weeklyTrend = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().split("T")[0]
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" })
      const reports = issues.filter((issue) =>
        issue.reported_at?.startsWith(dayStr)
      ).length
      const resolvedDay = issues.filter(
        (issue) => issue.status === "resolved" && issue.reported_at?.startsWith(dayStr)
      ).length
      weeklyTrend.push({ day: dayLabel, reports, resolved: resolvedDay })
    }

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const year = d.getFullYear()
      const month = d.getMonth() // 0-indexed
      const monthLabel = d.toLocaleDateString("en-US", { month: "short" })
      const reported = issues.filter((issue) => {
        if (!issue.reported_at) return false
        const t = new Date(issue.reported_at)
        return t.getFullYear() === year && t.getMonth() === month
      }).length
      const resolvedMonth = issues.filter((issue) => {
        if (!issue.reported_at || issue.status !== "resolved") return false
        const t = new Date(issue.reported_at)
        return t.getFullYear() === year && t.getMonth() === month
      }).length
      monthlyTrend.push({ month: monthLabel, reported, resolved: resolvedMonth })
    }

    // Issues by department
    const byDepartment: Record<string, number> = {}
    for (const issue of issues) {
      const dept = issue.department ?? "General"
      byDepartment[dept] = (byDepartment[dept] ?? 0) + 1
    }

    return NextResponse.json({
      total,
      resolved,
      inProgress,
      critical,
      submitted,
      todayCount,
      byCategory,
      byStatus,
      weeklyTrend,
      monthlyTrend,
      byDepartment,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
