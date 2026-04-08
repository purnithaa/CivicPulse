"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { CitizenHeader } from "@/components/citizen-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { CategoryIcon } from "@/components/category-icon"
import { categoryLabels, type IssueStatus } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api-base"
import { IssueComments } from "@/components/issue-comments"
import { notifyIssueUpdates } from "@/lib/push-notifications"
import {
  MapPin,
  Clock,
  ThumbsUp,
  Bell,
  CheckCircle2,
  Truck,
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  Phone,
  User,
  Loader2,
} from "lucide-react"

function timeAgo(dateStr: string | undefined | null) {
  if (!dateStr) return "—"
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return "—"
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function MyReportsPage() {
  const [filter, setFilter] = useState<"all" | IssueStatus>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

  const { user, isLoggedIn } = useAuth()

  // Load seen notification IDs from localStorage when user changes
  useEffect(() => {
    if (!user) { setSeenIds(new Set()); return }
    const key = `civicpulse_seen_notifs_${user.email || user.phone}`
    try {
      const raw = localStorage.getItem(key)
      setSeenIds(raw ? new Set(JSON.parse(raw) as string[]) : new Set())
    } catch {
      setSeenIds(new Set())
    }
  }, [user])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function load() {
      if (!isLoggedIn || !user) {
        setIssues([])
        return
      }
      try {
        setLoading(true)
        const res = await fetch(apiUrl("/api/issues"))
        const data = await res.json()
        if (!Array.isArray(data)) {
          setIssues([])
          return
        }
        const identifier = (user.phone || user.email)?.toLowerCase?.()
        if (identifier) {
          const mine = data.filter(
            (i: any) =>
              typeof i.reporter_contact === "string" &&
              i.reporter_contact.toLowerCase() === identifier
          )
          setIssues(mine)
          // Fire browser push notifications for unread status changes
          // Pass storageKey so newly fired notif IDs are persisted immediately (prevents spam)
          const key = `civicpulse_seen_notifs_${identifier}`
          try {
            const raw = localStorage.getItem(key)
            const seen = new Set<string>(raw ? JSON.parse(raw) : [])
            notifyIssueUpdates(mine, seen, key)
          } catch { /* ignore */ }
        } else {
          setIssues([])
        }
      } catch {
        setIssues([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isLoggedIn, user])

  const markAllRead = useCallback((notifIds: string[]) => {
    if (!user) return
    const key = `civicpulse_seen_notifs_${user.email || user.phone}`
    setSeenIds((prev) => {
      const next = new Set([...prev, ...notifIds])
      localStorage.setItem(key, JSON.stringify([...next]))
      return next
    })
  }, [user])

  const filteredIssues = useMemo(() => {
    if (filter === "all") return issues
    return issues.filter((i) => i.status === filter)
  }, [issues, filter])

  const myNotifications = useMemo(() => {
    const notifs: {
      id: string
      issueId: string
      message: string
      type: "submitted" | "in-review" | "dispatched" | "resolved"
      read: boolean
      createdAt: string
    }[] = []

    for (const issue of issues) {
      const id = issue.id
      const title = issue.title ?? "your issue"
      const status: IssueStatus = issue.status
      const reportedAt: string = issue.reportedAt ?? issue.reported_at ?? new Date().toISOString()
      const updatedAt: string = issue.updatedAt ?? issue.updated_at ?? reportedAt
      const staffName: string | undefined =
        issue.assigned_staff_name ?? issue.assignedStaff?.name ?? undefined

      // 1. Submitted — always present, always read
      notifs.push({
        id: `${id}-submitted`,
        issueId: id,
        message: `Your report "${title}" has been submitted successfully.`,
        type: "submitted",
        read: true,
        createdAt: reportedAt,
      })

      // 2. In-review — shown when status is in-review or beyond
      if (["in-review", "dispatched", "resolved"].includes(status)) {
        notifs.push({
          id: `${id}-review`,
          issueId: id,
          message: `Your report "${title}" is now under review.`,
          type: "in-review",
          read: status !== "in-review",
          createdAt: updatedAt,
        })
      }

      // 3. Dispatched — shown when dispatched or resolved
      if (["dispatched", "resolved"].includes(status)) {
        const msg = staffName
          ? `Staff member ${staffName} has been dispatched to your report "${title}".`
          : `Staff has been dispatched to your report "${title}".`
        notifs.push({
          id: `${id}-dispatched`,
          issueId: id,
          message: msg,
          type: "dispatched",
          read: status !== "dispatched",
          createdAt: updatedAt,
        })
      }

      // 4. Resolved
      if (status === "resolved") {
        notifs.push({
          id: `${id}-resolved`,
          issueId: id,
          message: `Your report "${title}" has been resolved. Thank you for helping improve your city!`,
          type: "resolved",
          read: false,
          createdAt: updatedAt,
        })
      }
    }

    // Most recent first
    return notifs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [issues])

  return (
    <div className="min-h-screen bg-background">
      <CitizenHeader />
      <main className="mx-auto max-w-3xl px-4 pb-24 md:pb-8">
        <div className="mt-6">
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            My Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track the status of your reported issues and view notifications
          </p>
        </div>

        <Tabs
          defaultValue="reports"
          className="mt-6"
          onValueChange={(v) => {
            if (v === "notifications") {
              markAllRead(myNotifications.map((n) => n.id))
            }
          }}
        >
          <TabsList className="w-full">
            <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
            <TabsTrigger value="notifications" className="relative flex-1">
              Notifications
              {myNotifications.filter((n) => !seenIds.has(n.id)).length > 0 && (
                <Badge className="ml-2 h-5 min-w-5 rounded-full bg-destructive px-1.5 text-[10px] text-primary-foreground">
                  {myNotifications.filter((n) => !seenIds.has(n.id)).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(["all", "submitted", "in-review", "dispatched", "resolved"] as const).map(
                (s) => (
                  <Button
                    key={s}
                    variant={filter === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(s)}
                    className="shrink-0"
                  >
                    {s === "all" ? "All" : s === "in-review" ? "In Review" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                )
              )}
            </div>

            {/* Issues list */}
            <div className="mt-4 flex flex-col gap-3">
              {!isLoggedIn ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Sign in to view your reports
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create an account or log in, then file an issue to start tracking it here.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">Loading your reports…</p>
                </div>
              ) : filteredIssues.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Search className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-sm font-medium text-foreground">No reports yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You haven&apos;t reported any issues under this account.
                  </p>
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const isExpanded = expandedId === issue.id
                  return (
                    <Card
                      key={issue.id}
                      className="border-border bg-card transition-all"
                    >
                      <CardContent className="p-4">
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 text-left"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : issue.id)
                          }
                        >
                          <CategoryIcon category={issue.category} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-foreground leading-tight">
                                {issue.title}
                              </h3>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <StatusBadge status={issue.status} />
                              <PriorityBadge priority={issue.priority} />
                              <span className="text-xs text-muted-foreground">
                                {issue.id}
                              </span>
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                            <p className="text-sm text-foreground leading-relaxed">
                              {issue.description}
                            </p>

                            {/* Status timeline */}
                            <div className="flex flex-col gap-2">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Progress
                              </h4>
                              <StatusTimeline status={issue.status} />
                            </div>

                            {/* Assigned Staff Section — uses API fields */}
                            {issue.assigned_staff_name && (
                              <div className="flex flex-col gap-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Assigned Staff
                                </h4>
                                <div className="rounded-lg border border-border bg-muted/30 p-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                      {issue.assigned_staff_name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-foreground">
                                        {issue.assigned_staff_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Field Staff
                                      </p>
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className="bg-warning/15 text-warning border-warning/30"
                                    >
                                      Working
                                    </Badge>
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    {issue.assigned_staff_phone && (
                                      <a
                                        href={`tel:${String(issue.assigned_staff_phone).replace(/\s/g, "")}`}
                                        className="flex-1"
                                      >
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full gap-2 text-xs"
                                        >
                                          <Phone className="h-3.5 w-3.5" />
                                          Call Staff
                                        </Button>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {!issue.assigned_staff_name && (issue.status === "submitted" || issue.status === "in-review") && (
                              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
                                <User className="mx-auto h-6 w-6 text-muted-foreground" />
                                <p className="mt-2 text-xs font-medium text-muted-foreground">
                                  Staff not yet assigned
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  The admin team will assign a staff member soon
                                </p>
                              </div>
                            )}

                            {/* Comments section */}
                            <div className="rounded-lg border border-border bg-muted/20 p-4">
                              <IssueComments
                                issueId={issue.id}
                                authorName={user?.name ?? "Citizen"}
                                authorRole="citizen"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Location</p>
                                  <p className="text-xs font-medium text-foreground">{issue.location}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Department</p>
                                  <p className="text-xs font-medium text-foreground">{issue.department}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Reported</p>
                                  <p className="text-xs font-medium text-foreground">{mounted ? timeAgo(issue.reportedAt ?? issue.reported_at) : "..."}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Upvotes</p>
                                  <p className="text-xs font-medium text-foreground">{issue.upvotes}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            {!isLoggedIn ? (
              <div className="flex flex-col items-center py-12 text-center">
                <User className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium text-foreground">
                  Sign in to view your notifications
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Notifications appear when updates happen on your reports.
                </p>
              </div>
            ) : myNotifications.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <Bell className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium text-foreground">No notifications</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You will receive updates here for issues you report.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myNotifications.map((n) => (
                  <Card
                    key={n.id}
                    className={`border-border bg-card ${!seenIds.has(n.id) ? "border-l-4 border-l-primary" : ""}`}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        n.type === "resolved"
                          ? "bg-success/15"
                          : n.type === "dispatched"
                          ? "bg-warning/15"
                          : "bg-primary/15"
                      }`}>
                        {n.type === "resolved" ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : n.type === "dispatched" ? (
                          <Truck className="h-5 w-5 text-warning" />
                        ) : (
                          <Bell className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {mounted ? timeAgo(n.createdAt) : "..."}
                          </span>
                          <span className="text-xs text-primary font-medium">
                            {n.issueId}
                          </span>
                        </div>
                      </div>
                      {!seenIds.has(n.id) && (
                        <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <MobileBottomNav />
    </div>
  )
}

function StatusTimeline({ status }: { status: IssueStatus }) {
  const steps: { key: IssueStatus; label: string }[] = [
    { key: "submitted", label: "Submitted" },
    { key: "in-review", label: "In Review" },
    { key: "dispatched", label: "Dispatched" },
    { key: "resolved", label: "Resolved" },
  ]

  const currentIndex = steps.findIndex((s) => s.key === status)

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isComplete = i <= currentIndex
        const isCurrent = i === currentIndex
        return (
          <div key={step.key} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium ${
                  isComplete ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full mb-4 ${
                  i < currentIndex ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
