"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  CheckCircle2,
  ClipboardList,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { useStaffAuth } from "@/lib/staff-auth-context"
import { apiUrl } from "@/lib/api-base"
import {
  mockLeaveRequests,
  staffStatusLabels,
  type StaffStatus,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface NormalizedIssue {
  id: string
  title: string
  category: string
  status: string
  priority: string
  location: string
  assignedStaffName?: string
  assignedStaffId?: string
}

const statusOptions: { value: StaffStatus; label: string; description: string }[] = [
  { value: "available", label: "Available", description: "Ready for new assignments" },
  { value: "busy", label: "Busy", description: "Working on active issues" },
  { value: "off-duty", label: "Off Duty", description: "Not on shift right now" },
]

const statusColors: Record<string, string> = {
  available: "border-success/50 bg-success/10 text-success hover:bg-success/20",
  busy: "border-warning/50 bg-warning/10 text-warning-foreground hover:bg-warning/20",
  "off-duty": "border-border bg-muted text-muted-foreground hover:bg-muted/80",
}

const statusActiveColors: Record<string, string> = {
  available: "border-success bg-success text-success-foreground ring-2 ring-success/30",
  busy: "border-warning bg-warning text-warning-foreground ring-2 ring-warning/30",
  "off-duty": "border-muted-foreground bg-muted-foreground text-background ring-2 ring-muted-foreground/30",
}

export default function StaffDashboardPage() {
  const { staffUser, updateStaffStatus } = useStaffAuth()
  const [changingStatus, setChangingStatus] = useState(false)
  const [allIssues, setAllIssues] = useState<NormalizedIssue[]>([])

  const loadIssues = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/issues"))
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        setAllIssues(
          data.map((raw: any) => ({
            id: raw.id,
            title: raw.title ?? "",
            category: raw.category ?? "other",
            status: raw.status ?? "submitted",
            priority: raw.priority ?? "medium",
            location: raw.location ?? "",
            assignedStaffName: raw.assigned_staff_name ?? raw.assignedStaff?.name,
            assignedStaffId: raw.assigned_staff_id ?? raw.assignedStaff?.id,
          }))
        )
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  const assignedIssues = useMemo(
    () =>
      allIssues.filter(
        (i) =>
          (staffUser?.name && i.assignedStaffName === staffUser.name) ||
          (staffUser?.id && i.assignedStaffId === staffUser.id)
      ),
    [allIssues, staffUser?.name, staffUser?.id]
  )

  const activeIssues = assignedIssues.filter((i) => i.status === "dispatched")
  const resolvedIssues = assignedIssues.filter((i) => i.status === "resolved")

  const myLeaveRequests = useMemo(
    () => mockLeaveRequests.filter((lr) => lr.staffId === staffUser?.id),
    [staffUser?.id]
  )
  const pendingLeave = myLeaveRequests.filter((lr) => lr.status === "pending")

  const handleStatusChange = (newStatus: StaffStatus) => {
    if (!staffUser || newStatus === staffUser.status) return
    if (newStatus === "off-duty" && activeIssues.length > 0) {
      toast.warning(
        `You have ${activeIssues.length} active issue${activeIssues.length > 1 ? "s" : ""}. Please resolve or reassign them before going off duty.`
      )
      return
    }
    setChangingStatus(true)
    setTimeout(() => {
      updateStaffStatus(newStatus)
      setChangingStatus(false)
      toast.success(`Status updated to ${staffStatusLabels[newStatus]}`)
    }, 400)
  }

  if (!staffUser) return null

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-foreground lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Welcome, {staffUser.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {staffUser.department} &middot; {staffUser.employeeId}
        </p>
      </div>

      {/* Status Toggle */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {statusOptions.map((opt) => {
              const isActive = staffUser.status === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={changingStatus}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all",
                    isActive ? statusActiveColors[opt.value] : statusColors[opt.value],
                    changingStatus && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <span className="text-base font-bold">{opt.label}</span>
                  <span className={cn("text-xs", isActive ? "opacity-80" : "opacity-60")}>
                    {opt.description}
                  </span>
                </button>
              )
            })}
          </div>
          {staffUser.status === "on-leave" && (
            <div className="mt-3 rounded-lg border border-primary/30 bg-primary/10 p-3">
              <p className="text-sm text-primary font-medium">
                You are currently on approved leave. Your status will be updated when your leave ends.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/15">
              <ClipboardList className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                {activeIssues.length}
              </p>
              <p className="text-xs text-muted-foreground">Active Issues</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/15">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                {resolvedIssues.length}
              </p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                12
              </p>
              <p className="text-xs text-muted-foreground">Leave Balance</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                {pendingLeave.length}
              </p>
              <p className="text-xs text-muted-foreground">Pending Leave</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Issues Preview */}
      <div className="mt-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle
                className="text-base font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Active Issues
              </CardTitle>
              <Link href="/staff/issues">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeIssues.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-success/50" />
                <p className="text-sm text-muted-foreground">
                  No active issues assigned to you
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeIssues.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                        issue.priority === "critical"
                          ? "bg-destructive"
                          : issue.priority === "high"
                            ? "bg-warning"
                            : "bg-primary"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {issue.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{issue.location}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px]",
                        issue.priority === "critical"
                          ? "border-destructive/30 text-destructive"
                          : issue.priority === "high"
                            ? "border-warning/30 text-warning-foreground"
                            : "border-border"
                      )}
                    >
                      {issue.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity placeholder */}
      <div className="mt-6">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Activity history will appear here once you start resolving issues.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
