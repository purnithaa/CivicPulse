"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { useStaffAuth } from "@/lib/staff-auth-context"
import { apiUrl } from "@/lib/api-base"
import { type LeaveRequestStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface LeaveRequest {
  id: string
  staff_id: string
  staff_name: string
  employee_id: string
  start_date: string
  end_date: string
  reason: string
  status: LeaveRequestStatus
  created_at: string
  reviewed_at?: string | null
}

const leaveStatusConfig: Record<
  LeaveRequestStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "bg-success/15 text-success border-success/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    icon: XCircle,
  },
}

export default function StaffLeavePage() {
  const { staffUser } = useStaffAuth()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadRequests = useCallback(async () => {
    if (!staffUser) return
    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/leave?staff_id=${staffUser.id}`))
      const data = await res.json()
      if (Array.isArray(data)) {
        setLeaveRequests(data)
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [staffUser])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const myRequests = useMemo(
    () =>
      [...leaveRequests].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [leaveRequests]
  )

  const pendingCount = myRequests.filter((r) => r.status === "pending").length
  const approvedCount = myRequests.filter((r) => r.status === "approved").length

  const handleSubmit = async () => {
    if (!staffUser) return
    if (!startDate) { toast.error("Please select a start date"); return }
    if (!endDate) { toast.error("Please select an end date"); return }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be before start date"); return
    }
    if (!reason.trim()) { toast.error("Please provide a reason for your leave"); return }

    setSubmitting(true)
    try {
      const res = await fetch(apiUrl("/api/leave"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staffUser.id,
          staffName: staffUser.name,
          employeeId: staffUser.employeeId,
          startDate,
          endDate,
          reason: reason.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === "dbNotReady") {
          const optimistic: LeaveRequest = {
            id: `local-${Date.now()}`,
            staff_id: staffUser.id,
            staff_name: staffUser.name,
            employee_id: staffUser.employeeId,
            start_date: startDate,
            end_date: endDate,
            reason: reason.trim(),
            status: "pending",
            created_at: new Date().toISOString(),
          }
          setLeaveRequests((prev) => [optimistic, ...prev])
          toast.success("Leave request submitted. Your admin will review it shortly.")
        } else {
          toast.error(data.error || "Failed to submit leave request")
          return
        }
      } else {
        setLeaveRequests((prev) => [data, ...prev])
        toast.success("Leave request submitted. Your admin will review it shortly.")
      }

      setStartDate("")
      setEndDate("")
      setReason("")
      setShowForm(false)
    } catch {
      toast.error("Network error — please try again")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

  const getDayCount = (start: string, end: string) => {
    const diff =
      (new Date(end + "T00:00:00").getTime() - new Date(start + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
    return diff + 1
  }

  if (!staffUser) return null

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-foreground lg:text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Leave Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request leave and track your leave history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadRequests} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "Request Leave"}
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                {myRequests.length}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/15">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                {pendingCount}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
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
                {approvedCount}
              </p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Request Form */}
      {showForm && (
        <Card className="mb-6 border-accent/30 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              New Leave Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
                <p className="text-xs text-muted-foreground">
                  Duration: {getDayCount(startDate, endDate)} day
                  {getDayCount(startDate, endDate) > 1 ? "s" : ""}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please describe the reason for your leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setStartDate("")
                    setEndDate("")
                    setReason("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !startDate || !endDate || !reason.trim()}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave History */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Leave History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No leave requests yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {myRequests.map((req) => {
                const config = leaveStatusConfig[req.status]
                const Icon = config.icon
                return (
                  <div
                    key={req.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(req.start_date)}
                            {req.start_date !== req.end_date &&
                              ` - ${formatDate(req.end_date)}`}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {getDayCount(req.start_date, req.end_date)} day
                            {getDayCount(req.start_date, req.end_date) > 1 ? "s" : ""}{" "}
                            &middot; Submitted{" "}
                            {new Date(req.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("shrink-0 gap-1", config.className)}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {req.reason}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
