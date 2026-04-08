"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { CategoryIcon } from "@/components/category-icon"
import { IssueComments } from "@/components/issue-comments"
import { categoryLabels, departmentMap, statusLabels } from "@/lib/mock-data"
import { apiUrl } from "@/lib/api-base"
import { toast } from "sonner"
import {
  MapPin, Clock, CheckCircle2, Truck, AlertTriangle, Navigation,
  Camera, Zap, Search, X, MessageSquare, Bell, Loader2, RefreshCw,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────
type IssueStatus = "submitted" | "in-review" | "dispatched" | "resolved"
type StaffStatus = "available" | "busy" | "off-duty"

interface Issue {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: IssueStatus
  location: string
  lat?: number | null
  lng?: number | null
  reported_at: string
  assigned_staff_id?: string | null
  assigned_staff_name?: string | null
  image_url?: string | null
}

interface Staff {
  id: string
  name: string
  employee_id: string
  phone: string
  department: string
  status: StaffStatus
  active_issues: number
  resolved_count: number
  avatar_initials: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
}

function shortId(id: string) {
  return id.slice(0, 6).toUpperCase()
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Assignment state
  const [deptFilter, setDeptFilter] = useState("auto")
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [resolvePhoto, setResolvePhoto] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [resolving, setResolving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Fetch data ─────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [issuesRes, staffRes] = await Promise.all([
        fetch(apiUrl("/api/issues")),
        fetch(apiUrl("/api/staff")),
      ])
      const issuesData = await issuesRes.json()
      const staffData = await staffRes.json()
      if (Array.isArray(issuesData)) setIssues(issuesData)
      if (Array.isArray(staffData)) setStaffList(staffData)
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Derived data ───────────────────────────────────────────────────────
  const filteredIssues =
    statusFilter === "all" ? issues : issues.filter((i) => i.status === statusFilter)

  const getFilteredStaff = () => {
    const suggestedDept = departmentMap[selectedIssue?.category ?? ""] ?? ""
    if (deptFilter === "auto") return staffList.filter((s) => s.department === suggestedDept)
    if (deptFilter === "all") return staffList
    return staffList.filter((s) => s.department === deptFilter)
  }

  // ── Open detail sheet ──────────────────────────────────────────────────
  const openIssue = (issue: Issue) => {
    setSelectedIssue(issue)
    setDeptFilter("auto")
    setSelectedStaffId(issue.assigned_staff_id ?? null)
    setResolvePhoto(null)
    setSheetOpen(true)
  }

  // ── Assign staff ───────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedIssue || !selectedStaffId) {
      toast.error("Please select a staff member")
      return
    }
    const staff = staffList.find((s) => s.id === selectedStaffId)
    if (!staff) return

    setAssigning(true)
    try {
      const res = await fetch(apiUrl(`/api/issues/${selectedIssue.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_staff_id: staff.id,
          assigned_staff_name: staff.name,
          assigned_staff_phone: staff.phone,
          status: "dispatched",
        }),
      })
      if (!res.ok) throw new Error("Failed to assign")
      const updated = await res.json()
      setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setSelectedIssue(updated)
      // Update the staff status to busy in local list
      setStaffList((prev) =>
        prev.map((s) => s.id === staff.id ? { ...s, status: "busy" as StaffStatus } : s)
      )
      toast.success(`${staff.name} assigned`, {
        description: `Issue dispatched to ${staff.department} department.`,
      })
    } catch {
      toast.error("Failed to assign staff")
    } finally {
      setAssigning(false)
    }
  }

  // ── Status change ──────────────────────────────────────────────────────
  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    try {
      const res = await fetch(apiUrl(`/api/issues/${issueId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setSelectedIssue((prev) => (prev?.id === updated.id ? updated : prev))
      toast.success(`Status updated to ${statusLabels[newStatus] ?? newStatus}`)
    } catch {
      toast.error("Failed to update status")
    }
  }

  // ── Resolve ────────────────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!selectedIssue) return
    if (!resolvePhoto) {
      toast.error("Please upload an after-photo to mark as resolved")
      return
    }
    setResolving(true)
    try {
      const res = await fetch(apiUrl(`/api/issues/${selectedIssue.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      setSelectedIssue(updated)
      toast.success("Issue marked as resolved", {
        description: "Citizen has been notified.",
      })
    } catch {
      toast.error("Failed to resolve issue")
    } finally {
      setResolving(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setResolvePhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            All Issues
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage, assign staff, and resolve reported urban issues
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Issue Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `${filteredIssues.length} issues`}
            </span>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading issues...</span>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
              <Search className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No issues yet</p>
              <p className="text-xs text-muted-foreground/60">
                Issues reported by citizens will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Priority</TableHead>
                    <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                    <TableHead className="hidden md:table-cell">Reported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow
                      key={issue.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openIssue(issue)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{shortId(issue.id)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={issue.category} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {issue.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {categoryLabels[issue.category] ?? issue.category}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {issue.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={issue.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <PriorityBadge priority={issue.priority} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {issue.assigned_staff_name ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                              {issue.assigned_staff_name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs text-foreground">{issue.assigned_staff_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {issue.reported_at ? formatDate(issue.reported_at) : "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Detail + Smart Assignment Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selectedIssue && (
            <div className="flex flex-col gap-6 pb-8">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <CategoryIcon category={selectedIssue.category} />
                  <div>
                    <SheetTitle className="text-left text-base leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                      {selectedIssue.title}
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground">
                      #{shortId(selectedIssue.id)} · {categoryLabels[selectedIssue.category] ?? selectedIssue.category}
                    </p>
                  </div>
                </div>
              </SheetHeader>

              {/* Status & Priority */}
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedIssue.status} />
                <PriorityBadge priority={selectedIssue.priority} />
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm text-foreground leading-relaxed">{selectedIssue.description}</p>
              </div>

              {/* Location & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Location</p>
                    <p className="text-xs font-medium text-foreground">{selectedIssue.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Reported</p>
                    <p className="text-xs font-medium text-foreground">
                      {selectedIssue.reported_at ? formatDate(selectedIssue.reported_at) : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedIssue.lat && selectedIssue.lng && (
                <a
                  href={`https://www.google.com/maps?q=${selectedIssue.lat},${selectedIssue.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Navigation className="h-4 w-4" />
                    View on Map
                  </Button>
                </a>
              )}

              {/* Issue Photo */}
              {selectedIssue.image_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">Issue Photo</Label>
                  <div className="mt-1 overflow-hidden rounded-lg border border-border">
                    <img
                      src={selectedIssue.image_url}
                      alt="Issue photo"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Updates & Comments (staff progress, citizen comments, resolution) */}
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <IssueComments issueId={selectedIssue.id} readOnly />
              </div>

              <Separator />

              {/* Quick Status Actions */}
              {selectedIssue.status !== "resolved" && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Actions
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIssue.status !== "in-review" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleStatusChange(selectedIssue.id, "in-review")}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Mark In Review
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Smart Assignment Panel */}
              {selectedIssue.status !== "resolved" && (
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                      {selectedIssue.status === "dispatched" ? "Re-assign Staff" : "Smart Assignment"}
                    </Label>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Auto-suggested department:{" "}
                    <span className="font-semibold text-primary">
                      {departmentMap[selectedIssue.category] ?? "General"}
                    </span>
                  </p>

                  {/* Department filter */}
                  <div className="mt-3 flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Filter Staff by Department</Label>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Suggested ({departmentMap[selectedIssue.category] ?? "General"})</SelectItem>
                        <SelectItem value="all">All Departments</SelectItem>
                        {Array.from(new Set(staffList.map((s) => s.department))).map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Staff list */}
                  <div className="mt-3 flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground">Select Staff Member</Label>
                    {staffList.length === 0 ? (
                      <p className="rounded-lg border border-border p-4 text-center text-xs text-muted-foreground">
                        No staff added yet. Add staff in Staff Management.
                      </p>
                    ) : getFilteredStaff().length === 0 ? (
                      <p className="rounded-lg border border-border p-4 text-center text-xs text-muted-foreground">
                        No staff in this department. Try "All Departments".
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                        {getFilteredStaff().map((staff) => {
                          const isSelected = selectedStaffId === staff.id
                          return (
                            <button
                              key={staff.id}
                              type="button"
                              onClick={() => setSelectedStaffId(staff.id)}
                              className={`flex w-full items-center gap-3 border-b border-border p-3 text-left transition-colors last:border-0 ${
                                isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                              } ${staff.status === "off-duty" ? "opacity-50" : ""}`}
                              disabled={staff.status === "off-duty"}
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                                {staff.avatar_initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{staff.name}</p>
                                <p className="text-[10px] text-muted-foreground">{staff.department}</p>
                              </div>
                              <div className="flex flex-col items-end gap-0.5">
                                <StaffStatusDot status={staff.status} />
                                <span className="text-[10px] text-muted-foreground">
                                  {staff.active_issues} active
                                </span>
                              </div>
                              {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Currently assigned */}
                  {selectedIssue.assigned_staff_name && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Currently Assigned
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {selectedIssue.assigned_staff_name.slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-foreground">{selectedIssue.assigned_staff_name}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    className="mt-3 w-full gap-2"
                    onClick={handleAssign}
                    disabled={!selectedStaffId || assigning}
                    variant={selectedIssue.status === "dispatched" ? "outline" : "default"}
                  >
                    {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    {assigning
                      ? "Assigning..."
                      : selectedIssue.status === "dispatched"
                      ? "Re-assign Staff"
                      : "Assign & Dispatch"}
                  </Button>

                  <div className="mt-2 flex flex-col gap-1 rounded-lg bg-muted/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">On Assignment</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />SMS with location sent to staff
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Bell className="h-3 w-3" />Push notification sent to citizen
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Navigation className="h-3 w-3" />Staff receives GPS location of issue
                    </div>
                  </div>
                </div>
              )}

              {/* Resolve with photo */}
              {selectedIssue.status === "dispatched" && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <Label className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                        Mark as Resolved
                      </Label>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Upload an after-photo as proof of completion
                    </p>
                    <div className="mt-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      {resolvePhoto ? (
                        <div className="relative rounded-lg border border-border overflow-hidden">
                          <img src={resolvePhoto} alt="Resolution proof" className="h-40 w-full object-cover" />
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute right-2 top-2 h-7 w-7"
                            onClick={() => setResolvePhoto(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/30"
                        >
                          <Camera className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Upload After-Photo</span>
                          <span className="text-xs text-muted-foreground">Required to mark as resolved</span>
                        </button>
                      )}
                    </div>
                    <Button
                      className="mt-3 w-full gap-2 bg-success text-success-foreground hover:bg-success/90"
                      onClick={handleResolve}
                      disabled={!resolvePhoto || resolving}
                    >
                      {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {resolving ? "Resolving..." : "Confirm Resolution"}
                    </Button>
                  </div>
                </>
              )}

              {/* Already resolved */}
              {selectedIssue.status === "resolved" && (
                <>
                  <Separator />
                  <div className="rounded-lg bg-success/10 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
                    <p className="mt-2 text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                      Issue Resolved
                    </p>
                    {selectedIssue.assigned_staff_name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Resolved by {selectedIssue.assigned_staff_name}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function StaffStatusDot({ status }: { status: StaffStatus }) {
  const config: Record<StaffStatus, { color: string; label: string }> = {
    available: { color: "bg-success", label: "Available" },
    busy: { color: "bg-warning", label: "Busy" },
    "off-duty": { color: "bg-muted-foreground", label: "Off Duty" },
  }
  const c = config[status]
  return (
    <div className="flex items-center gap-1">
      <div className={`h-2 w-2 rounded-full ${c.color}`} />
      <span className="text-[10px] text-muted-foreground">{c.label}</span>
    </div>
  )
}
