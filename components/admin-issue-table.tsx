"use client"

import { useState, useEffect, useMemo } from "react"
import { apiUrl } from "@/lib/api-base"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { CategoryIcon } from "@/components/category-icon"
import {
  categoryLabels,
  statusLabels,
  mockStaff,
  type IssueStatus,
  type IssueCategory,
} from "@/lib/mock-data"
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Truck,
  AlertTriangle,
  MapPin,
  Search,
  Download,
  Users,
  Loader2,
  RefreshCw,
  FileText,
  FileSpreadsheet,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

function exportPDF(issues: any[]) {
  const rows = issues.map((i) => `
    <tr>
      <td>${i.id?.slice(0, 8) ?? "-"}</td>
      <td>${i.title ?? "-"}</td>
      <td>${categoryLabels[i.category as IssueCategory] ?? i.category ?? "-"}</td>
      <td>${statusLabels[i.status as IssueStatus] ?? i.status ?? "-"}</td>
      <td>${i.priority ?? "-"}</td>
      <td>${i.location ?? "-"}</td>
      <td>${i.department ?? "-"}</td>
      <td>${i.reporter_name ?? "-"}</td>
      <td>${formatDate(i.reported_at ?? i.reportedAt)}</td>
    </tr>`).join("")

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>CivicPulse Issues Report</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p { color: #666; margin-bottom: 16px; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #4f46e5; color: white; padding: 8px 6px; text-align: left; font-size: 10px; }
    td { border-bottom: 1px solid #e5e7eb; padding: 7px 6px; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>CivicPulse — Issues Report</h1>
  <p>Generated on ${new Date().toLocaleString()} &nbsp;|&nbsp; ${issues.length} issues</p>
  <table>
    <thead>
      <tr>
        <th>ID</th><th>Title</th><th>Category</th><th>Status</th>
        <th>Priority</th><th>Location</th><th>Department</th>
        <th>Reporter</th><th>Reported At</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`

  const win = window.open("", "_blank", "width=1100,height=800")
  if (!win) { toast.error("Popup blocked — please allow popups for PDF export"); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 300)
  toast.success("PDF print dialog opened")
}

function exportExcel(issues: any[]) {
  const escape = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const cell = (v: string) => `<td>${escape(v)}</td>`
  const rows = issues.map((i) => `<tr>
    ${cell(i.id ?? "")}
    ${cell(i.title ?? "")}
    ${cell(categoryLabels[i.category as IssueCategory] ?? i.category ?? "")}
    ${cell(statusLabels[i.status as IssueStatus] ?? i.status ?? "")}
    ${cell(i.priority ?? "")}
    ${cell(i.location ?? "")}
    ${cell(i.department ?? "")}
    ${cell(i.reporter_name ?? "")}
    ${cell(i.reporter_contact ?? "")}
    ${cell(i.reported_at ?? "")}
  </tr>`).join("")

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:x="urn:schemas-microsoft-com:office:excel"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/>
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>Issues</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body>
<table>
<thead><tr style="background:#4f46e5;color:white;font-weight:bold;">
<th>ID</th><th>Title</th><th>Category</th><th>Status</th><th>Priority</th>
<th>Location</th><th>Department</th><th>Reporter</th><th>Contact</th><th>Reported At</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `civicpulse-issues-${new Date().toISOString().split("T")[0]}.xls`
  a.click()
  URL.revokeObjectURL(url)
  toast.success("Exported to Excel (.xls)")
}

function exportCSV(issues: any[]) {
  const headers = ["ID","Title","Category","Status","Priority","Location","Department","Reporter","Contact","Reported At"]
  const rows = issues.map((i) => [
    i.id,
    `"${(i.title ?? "").replace(/"/g, '""')}"`,
    i.category ?? "",
    i.status ?? "",
    i.priority ?? "",
    `"${(i.location ?? "").replace(/"/g, '""')}"`,
    `"${(i.department ?? "").replace(/"/g, '""')}"`,
    `"${(i.reporter_name ?? "").replace(/"/g, '""')}"`,
    `"${(i.reporter_contact ?? "").replace(/"/g, '""')}"`,
    i.reported_at ?? "",
  ])
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `civicpulse-issues-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success("Exported to CSV")
}

export function AdminIssueTable() {
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<any>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailIssue, setDetailIssue] = useState<any>(null)
  const [staffList, setStaffList] = useState<any[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadIssues = () => {
    setLoading(true)
    fetch(apiUrl("/api/issues"))
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setIssues(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadIssues() }, [])

  const REFRESH_INTERVAL_MS = 15000
  useEffect(() => {
    const interval = setInterval(loadIssues, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (statusFilter !== "all" && issue.status !== statusFilter) return false
      if (categoryFilter !== "all" && issue.category !== categoryFilter) return false
      if (priorityFilter !== "all" && issue.priority !== priorityFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !issue.title?.toLowerCase().includes(q) &&
          !issue.id?.toLowerCase().includes(q) &&
          !issue.location?.toLowerCase().includes(q) &&
          !issue.reporter_name?.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [issues, statusFilter, categoryFilter, priorityFilter, search])

  const handleStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    setUpdatingId(issueId)
    // Optimistic update
    setIssues((prev) =>
      prev.map((i) => i.id === issueId ? { ...i, status: newStatus, updated_at: new Date().toISOString() } : i)
    )
    try {
      const res = await fetch(apiUrl(`/api/issues/${issueId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Update failed")
      toast.success(`Status updated to "${statusLabels[newStatus]}"`)
    } catch {
      // Revert on failure
      loadIssues()
      toast.error("Failed to update status")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAssignStaff = async (issue: any) => {
    setSelectedIssue(issue)
    setAssignModalOpen(true)
    setStaffLoading(true)
    try {
      const res = await fetch(apiUrl("/api/staff"))
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setStaffList(data.map((s: any) => ({
          id: s.id,
          name: s.name,
          department: s.department,
          status: s.status ?? "available",
          activeIssues: s.active_issues ?? 0,
          avatarInitials: s.avatar_initials ?? s.name?.slice(0, 2).toUpperCase(),
          employeeId: s.employee_id,
          phone: s.phone,
        })))
      } else {
        setStaffList(mockStaff.map((s: any) => ({
          ...s,
          phone: s.phone,
        })))
      }
    } catch {
      setStaffList(mockStaff as any[])
    } finally {
      setStaffLoading(false)
    }
  }

  const handleStaffAssigned = async (staff: any) => {
    if (!selectedIssue) return
    const newStatus = selectedIssue.status === "submitted" ? "dispatched" : selectedIssue.status
    setIssues((prev) =>
      prev.map((i) =>
        i.id === selectedIssue.id
          ? { ...i, assigned_staff_name: staff.name, assigned_staff_id: staff.id, assigned_staff_phone: staff.phone, status: newStatus }
          : i
      )
    )
    setStaffList((prev) =>
      prev.map((s) => (s.id === staff.id ? { ...s, status: "busy", activeIssues: (s.activeIssues ?? 0) + 1 } : s))
    )
    try {
      await fetch(apiUrl(`/api/issues/${selectedIssue.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_staff_name: staff.name,
          assigned_staff_id: staff.id,
          assigned_staff_phone: staff.phone ?? null,
          status: newStatus,
        }),
      })
      toast.success(`${staff.name} assigned to the issue`)
    } catch {
      toast.error("Failed to save assignment")
    }
    setAssignModalOpen(false)
    setSelectedIssue(null)
  }

  return (
    <div>
      {/* Filters row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, ID, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in-review">In Review</SelectItem>
            <SelectItem value="dispatched">Dispatched</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {filteredIssues.length} issues
          </span>
          <Button variant="outline" size="sm" onClick={loadIssues} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={() => exportPDF(filteredIssues)}>
                <FileText className="h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => exportExcel(filteredIssues)}>
                <FileSpreadsheet className="h-4 w-4" />
                Export as Excel (.xls)
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => exportCSV(filteredIssues)}>
                <Download className="h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Priority</TableHead>
              <TableHead className="hidden lg:table-cell">Department</TableHead>
              <TableHead className="hidden md:table-cell">Reported</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading issues...</p>
                </TableCell>
              </TableRow>
            ) : filteredIssues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No issues found
                </TableCell>
              </TableRow>
            ) : (
              filteredIssues.map((issue) => (
                <TableRow key={issue.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {issue.id?.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={issue.category} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabels[issue.category as IssueCategory] ?? issue.category}
                        </p>
                        {issue.assigned_staff_name && (
                          <p className="text-[10px] text-primary mt-0.5">👤 {issue.assigned_staff_name}</p>
                        )}
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
                    {updatingId === issue.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <StatusBadge status={issue.status} />
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <PriorityBadge priority={issue.priority} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{issue.department}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(issue.reported_at ?? issue.reportedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => { setDetailIssue(issue); setDetailModalOpen(true) }}>
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleAssignStaff(issue)}>
                          <Users className="h-4 w-4" />
                          Assign Staff
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {issue.status !== "in-review" && (
                          <DropdownMenuItem className="gap-2" onClick={() => handleStatusChange(issue.id, "in-review")}>
                            <AlertTriangle className="h-4 w-4" />
                            Mark In Review
                          </DropdownMenuItem>
                        )}
                        {issue.status !== "dispatched" && (
                          <DropdownMenuItem className="gap-2" onClick={() => handleStatusChange(issue.id, "dispatched")}>
                            <Truck className="h-4 w-4" />
                            Dispatch Crew
                          </DropdownMenuItem>
                        )}
                        {issue.status !== "resolved" && (
                          <DropdownMenuItem className="gap-2" onClick={() => handleStatusChange(issue.id, "resolved")}>
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Resolved
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Staff Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Assign Staff Member</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="mb-4 rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground line-clamp-1">{selectedIssue.title}</p>
              <p className="text-xs text-muted-foreground">{selectedIssue.department}</p>
            </div>
          )}
          {staffLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {staffList.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No staff available</p>
              ) : (
                staffList
                  .filter((s) => {
                    const isAssignedToDispatched = issues.some(
                      (i) => i.assigned_staff_id === s.id && (i.status === "dispatched" || i.status === "in-review")
                    )
                    return s.status === "available" && !isAssignedToDispatched
                  })
                  .map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => handleStaffAssigned(staff)}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {staff.avatarInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{staff.name}</p>
                        <p className="text-xs text-muted-foreground">{staff.department}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-success/15 text-success border-success/30"
                      >
                        Available
                      </Badge>
                    </button>
                  ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>
          {detailIssue && (
            <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-lg font-semibold text-foreground">{detailIssue.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{detailIssue.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Status", value: <StatusBadge status={detailIssue.status} /> },
                  { label: "Priority", value: <PriorityBadge priority={detailIssue.priority} /> },
                  { label: "Category", value: categoryLabels[detailIssue.category as IssueCategory] ?? detailIssue.category },
                  { label: "Department", value: detailIssue.department },
                  {
                    label: "Location",
                    value: detailIssue.lat != null && detailIssue.lng != null ? (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${detailIssue.lat},${detailIssue.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:no-underline"
                      >
                        {detailIssue.location}
                      </a>
                    ) : (
                      detailIssue.location
                    ),
                  },
                  { label: "Reporter", value: detailIssue.reporter_name ?? "—" },
                  { label: "Contact", value: detailIssue.reporter_contact ?? "—" },
                  { label: "Reported", value: formatDate(detailIssue.reported_at) },
                  { label: "Assigned To", value: detailIssue.assigned_staff_name ?? "—" },
                  { label: "Last Updated", value: formatDate(detailIssue.updated_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                    <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
                  </div>
                ))}
              </div>
              {detailIssue.image_url && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <img src={detailIssue.image_url} alt="Issue" className="h-48 w-full object-cover" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
