"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Plus, Search, MoreHorizontal, Edit2, Trash2, Phone, Users, UserCheck, UserX,
  ClipboardList, CalendarDays, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, Key,
} from "lucide-react"
import {
  departments,
  type Staff, type StaffStatus,
  type LeaveRequest, type LeaveRequestStatus,
} from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { apiUrl } from "@/lib/api-base"

// --- Registry (localStorage) for staff auth cross-reference ---
const REGISTRY_KEY = "civicpulse_staff_registry"
interface StaffRegistryEntry { name: string; employeeId: string; phone: string; department: string }

function saveToRegistry(entries: StaffRegistryEntry[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(entries))
}

// Convert Supabase row → Staff shape used in UI
function rowToStaff(s: any): Staff {
  return {
    id: s.id ?? s.employee_id,
    name: s.name,
    phone: s.phone,
    employeeId: s.employee_id,
    department: s.department,
    status: (s.status ?? "available") as StaffStatus,
    activeIssues: s.active_issues ?? 0,
    resolvedCount: s.resolved_count ?? 0,
    avatarInitials: s.avatar_initials ?? s.name?.slice(0, 2).toUpperCase(),
  }
}

type ActiveTab = "staff" | "leave"

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("staff")
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [leaveFilter, setLeaveFilter] = useState<"all" | LeaveRequestStatus>("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formEmpId, setFormEmpId] = useState("")
  const [formDept, setFormDept] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [syncingLogins, setSyncingLogins] = useState(false)
  const [resettingPw, setResettingPw] = useState<string | null>(null)

  // Load staff and leave requests from Supabase
  const loadStaff = useCallback(async () => {
    setLoading(true)
    try {
      const [staffRes, leaveRes] = await Promise.all([
        fetch(apiUrl("/api/staff")),
        fetch(apiUrl("/api/leave")),
      ])
      const staffData = await staffRes.json()
      const leaveData = await leaveRes.json()

      if (Array.isArray(staffData) && staffData.length > 0) {
        const loaded = staffData.map(rowToStaff)
        setStaffList(loaded)
        saveToRegistry(loaded.map((s) => ({
          name: s.name, employeeId: s.employeeId, phone: s.phone, department: s.department,
        })))
      }
      if (Array.isArray(leaveData)) {
        setLeaveRequests(leaveData.map((r: any) => ({
          id: r.id,
          staffId: r.staff_id,
          staffName: r.staff_name,
          employeeId: r.employee_id ?? "",
          startDate: r.start_date,
          endDate: r.end_date,
          reason: r.reason,
          status: r.status as LeaveRequestStatus,
          createdAt: r.created_at,
          reviewedAt: r.reviewed_at ?? undefined,
        })))
      }
    } catch {
      toast.error("Could not load staff from server")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStaff() }, [loadStaff])

  const REFRESH_INTERVAL_MS = 15000
  useEffect(() => {
    const interval = setInterval(loadStaff, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadStaff])

  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
    const matchDept = departmentFilter === "all" || s.department === departmentFilter
    return matchSearch && matchDept
  })

  const totalActive = staffList.filter((s) => s.status === "available").length
  const totalBusy = staffList.filter((s) => s.status === "busy").length
  const totalOffDuty = staffList.filter((s) => s.status === "off-duty").length
  const totalOnLeave = staffList.filter((s) => s.status === "on-leave").length
  const pendingLeaveCount = leaveRequests.filter((r) => r.status === "pending").length

  const filteredLeaveRequests = leaveRequests
    .filter((r) => leaveFilter === "all" || r.status === leaveFilter)
    .sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1
      if (a.status !== "pending" && b.status === "pending") return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const resetForm = () => { setFormName(""); setFormPhone(""); setFormEmpId(""); setFormDept(""); setFormPassword("") }

  const handleResetPassword = async (staff: Staff) => {
    setResettingPw(staff.employeeId)
    try {
      const res = await fetch(apiUrl("/api/staff/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: staff.employeeId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Password reset for ${staff.name}. They can now log in with: Staff@123`)
      } else {
        toast.error(data.error || "Reset failed")
      }
    } catch {
      toast.error("Could not reset password")
    } finally {
      setResettingPw(null)
    }
  }

  const handleSyncLogins = async () => {
    setSyncingLogins(true)
    try {
      const res = await fetch(apiUrl("/api/staff/sync-logins"), { method: "POST" })
      const data = await res.json()
      if (res.ok && data.synced > 0) {
        toast.success(`Created logins for ${data.synced} staff. They can now log in with password: ${data.defaultPassword ?? "password123"}`)
        loadStaff()
      } else if (res.ok && data.synced === 0) {
        toast.info("All staff already have logins.")
      } else {
        toast.error(data.error || "Sync failed")
      }
    } catch {
      toast.error("Could not sync logins")
    } finally {
      setSyncingLogins(false)
    }
  }

  const handleAdd = async () => {
    if (!formName || !formPhone || !formEmpId || !formDept) {
      toast.error("Please fill all fields"); return
    }
    setSaving(true)
    try {
      const res = await fetch(apiUrl("/api/staff"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          employeeId: formEmpId.trim(),
          phone: formPhone.trim(),
          department: formDept,
          password: formPassword.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // If Supabase table not ready, do local-only
        if (data.error === "dbNotReady") {
          const parts = formName.trim().split(" ")
          const initials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : formName.slice(0, 2).toUpperCase()
          const newStaff: Staff = {
            id: `local-${Date.now()}`, name: formName.trim(), phone: formPhone.trim(),
            employeeId: formEmpId.trim(), department: formDept, status: "available",
            activeIssues: 0, resolvedCount: 0, avatarInitials: initials,
          }
          setStaffList((prev) => {
            const updated = [...prev, newStaff]
            saveToRegistry(updated.map((s) => ({ name: s.name, employeeId: s.employeeId, phone: s.phone, department: s.department })))
            return updated
          })
          toast.success(`${newStaff.name} added (local only — Supabase table not ready)`)
        } else {
          toast.error(data.error || "Failed to add staff"); return
        }
      } else {
        const newStaff = rowToStaff(data)
        setStaffList((prev) => {
          const updated = [...prev, newStaff]
          saveToRegistry(updated.map((s) => ({ name: s.name, employeeId: s.employeeId, phone: s.phone, department: s.department })))
          return updated
        })
        const pw = data.defaultPassword ?? "Staff@123"
        toast.success(
          `${newStaff.name} added. Login: ${newStaff.employeeId} / ${pw} — they can change in Profile.`
        )
        await fetch(apiUrl("/api/staff/sync-logins"), { method: "POST" })
      }
      resetForm(); setIsAddOpen(false)
    } catch {
      toast.error("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingStaff || !formName || !formPhone || !formEmpId || !formDept) {
      toast.error("Please fill all fields"); return
    }
    setSaving(true)
    try {
      const res = await fetch(apiUrl("/api/staff"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingStaff.id, name: formName.trim(), employeeId: formEmpId.trim(), phone: formPhone.trim(), department: formDept }),
      })
      // Whether API succeeds or fails (table not ready), update locally
      setStaffList((prev) => {
        const updated = prev.map((s) =>
          s.id === editingStaff.id
            ? { ...s, name: formName.trim(), phone: formPhone.trim(), employeeId: formEmpId.trim(), department: formDept,
                avatarInitials: (() => { const p = formName.trim().split(" "); return p.length >= 2 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : formName.slice(0,2).toUpperCase() })() }
            : s
        )
        saveToRegistry(updated.map((s) => ({ name: s.name, employeeId: s.employeeId, phone: s.phone, department: s.department })))
        return updated
      })
      toast.success("Staff details updated")
      resetForm(); setEditingStaff(null); setIsEditOpen(false)
    } catch {
      toast.error("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (staff: Staff) => {
    // Optimistic remove
    setStaffList((prev) => {
      const updated = prev.filter((s) => s.id !== staff.id)
      saveToRegistry(updated.map((s) => ({ name: s.name, employeeId: s.employeeId, phone: s.phone, department: s.department })))
      return updated
    })
    toast.success(`${staff.name} has been removed`)
    // API call (best-effort)
    try {
      await fetch(apiUrl(`/api/staff?id=${staff.id}`), { method: "DELETE" })
    } catch { /* ignore */ }
  }

  const openEdit = (staff: Staff) => {
    setEditingStaff(staff)
    setFormName(staff.name)
    setFormPhone(staff.phone)
    setFormEmpId(staff.employeeId)
    setFormDept(staff.department)
    setIsEditOpen(true)
  }

  const handleApproveLeave = async (request: LeaveRequest) => {
    const reviewedAt = new Date().toISOString()
    // Optimistic update
    setLeaveRequests((prev) =>
      prev.map((r) => r.id === request.id ? { ...r, status: "approved" as const, reviewedAt } : r)
    )
    const today = new Date().toISOString().split("T")[0]
    if (request.startDate <= today && request.endDate >= today) {
      setStaffList((prev) => prev.map((s) => s.id === request.staffId ? { ...s, status: "on-leave" as const } : s))
    }
    toast.success(`Leave approved for ${request.staffName}`)
    // Persist to Supabase
    try {
      await fetch(apiUrl("/api/leave"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, status: "approved", reviewedAt }),
      })
    } catch { /* best-effort */ }
  }

  const handleRejectLeave = async (request: LeaveRequest) => {
    const reviewedAt = new Date().toISOString()
    // Optimistic update
    setLeaveRequests((prev) =>
      prev.map((r) => r.id === request.id ? { ...r, status: "rejected" as const, reviewedAt } : r)
    )
    toast.success(`Leave rejected for ${request.staffName}`)
    // Persist to Supabase
    try {
      await fetch(apiUrl("/api/leave"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, status: "rejected", reviewedAt }),
      })
    } catch { /* best-effort */ }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  const getDayCount = (start: string, end: string) =>
    Math.floor((new Date(end + "T00:00:00").getTime() - new Date(start + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24)) + 1

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage field staff, review leave requests, and track performance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadStaff} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          {activeTab === "staff" && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSyncLogins} disabled={syncingLogins}>
              {syncingLogins ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
              Sync logins
            </Button>
          )}
          {activeTab === "staff" && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => resetForm()}>
                  <Plus className="h-4 w-4" /> Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: "var(--font-heading)" }}>Add New Staff</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <p className="text-xs text-muted-foreground -mt-2">Staff logs in with Employee ID + Staff@123. They can change it from Profile.</p>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="add-name">Full Name</Label>
                    <Input id="add-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Enter staff name" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="add-phone">Phone Number</Label>
                    <Input id="add-phone" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="add-empid">Employee ID</Label>
                    <Input id="add-empid" value={formEmpId} onChange={(e) => setFormEmpId(e.target.value)} placeholder="EMP-XXXX" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="add-dept">Department</Label>
                    <Select value={formDept} onValueChange={setFormDept}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleAdd} disabled={saving}>
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Adding...</> : "Add Staff"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { icon: Users, value: staffList.length, label: "Total", color: "primary" },
          { icon: UserCheck, value: totalActive, label: "Available", color: "success" },
          { icon: ClipboardList, value: totalBusy, label: "Busy", color: "warning" },
          { icon: UserX, value: totalOffDuty, label: "Off Duty", color: "muted" },
          { icon: CalendarDays, value: totalOnLeave, label: "On Leave", color: "primary" },
        ].map(({ icon: Icon, value, label, color }) => (
          <Card key={label} className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${color}/15`}>
                <Icon className={`h-5 w-5 text-${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="mt-6 flex gap-1 rounded-lg border border-border bg-muted p-1">
        {(["staff", "leave"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors relative",
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "staff" ? "All Staff" : "Leave Requests"}
            {tab === "leave" && pendingLeaveCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive/15 px-1 text-[10px] font-bold text-destructive">
                {pendingLeaveCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <Card className="mt-4 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>All Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by name, ID, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Filter by department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Staff</TableHead>
                    <TableHead className="hidden sm:table-cell">Employee ID</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Resolved</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading staff...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        No staff found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staff, i) => (
                      <TableRow key={`staff-${staff.id}-${i}`} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                              {staff.avatarInitials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{staff.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{staff.employeeId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">{staff.employeeId}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />{staff.phone}
                          </div>
                        </TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{staff.department}</span></TableCell>
                        <TableCell><StaffStatusBadge status={staff.status} /></TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm font-bold ${staff.activeIssues >= 3 ? "text-destructive" : staff.activeIssues >= 1 ? "text-warning" : "text-success"}`}>
                            {staff.activeIssues}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          <span className="text-sm font-medium text-foreground">{staff.resolvedCount}</span>
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
                              <DropdownMenuItem className="gap-2" onClick={() => openEdit(staff)}>
                                <Edit2 className="h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => handleResetPassword(staff)}
                                disabled={resettingPw === staff.employeeId}
                              >
                                {resettingPw === staff.employeeId ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Key className="h-4 w-4" />
                                )}
                                Reset password
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="gap-2 text-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="h-4 w-4" /> Remove Staff
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove {staff.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove {staff.name} ({staff.employeeId}) from your staff list.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(staff)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {filteredStaff.length} of {staffList.length} staff members
            </p>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests Tab */}
      {activeTab === "leave" && (
        <Card className="mt-4 border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>Leave Requests</CardTitle>
              <Select value={leaveFilter} onValueChange={(v) => setLeaveFilter(v as typeof leaveFilter)}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLeaveRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No leave requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Staff</TableHead>
                      <TableHead>Date Range</TableHead>
                      <TableHead className="hidden md:table-cell">Duration</TableHead>
                      <TableHead className="hidden lg:table-cell">Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-40">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaveRequests.map((req, i) => (
                      <TableRow key={`leave-${req.id}-${i}`}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">{req.staffName}</p>
                            <p className="font-mono text-xs text-muted-foreground">{req.employeeId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">
                            {formatDate(req.startDate)}
                            {req.startDate !== req.endDate && <><br /><span className="text-muted-foreground">to </span>{formatDate(req.endDate)}</>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{getDayCount(req.startDate, req.endDate)} day{getDayCount(req.startDate, req.endDate) > 1 ? "s" : ""}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <p className="max-w-xs truncate text-sm text-muted-foreground">{req.reason}</p>
                        </TableCell>
                        <TableCell><LeaveStatusBadge status={req.status} /></TableCell>
                        <TableCell>
                          {req.status === "pending" ? (
                            <div className="flex items-center gap-2">
                              <Button size="sm" className="h-7 gap-1 bg-success text-success-foreground hover:bg-success/90 text-xs" onClick={() => handleApproveLeave(req)}>
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="h-7 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs">
                                    <XCircle className="h-3 w-3" /> Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject leave request?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Reject the leave request from {req.staffName} for {formatDate(req.startDate)}{req.startDate !== req.endDate && ` to ${formatDate(req.endDate)}`}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRejectLeave(req)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Reject</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {req.reviewedAt ? `Reviewed ${new Date(req.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "-"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Showing {filteredLeaveRequests.length} of {leaveRequests.length} requests</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-heading)" }}>Edit Staff Details</DialogTitle>
          </DialogHeader>
          <StaffForm name={formName} phone={formPhone} empId={formEmpId} dept={formDept}
            onNameChange={setFormName} onPhoneChange={setFormPhone} onEmpIdChange={setFormEmpId} onDeptChange={setFormDept} />
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StaffForm({ name, phone, empId, dept, password, onNameChange, onPhoneChange, onEmpIdChange, onDeptChange, onPasswordChange, showPasswordField }: {
  name: string; phone: string; empId: string; dept: string; password?: string
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void
  onEmpIdChange: (v: string) => void; onDeptChange: (v: string) => void
  onPasswordChange?: (v: string) => void; showPasswordField?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 py-4">
      {[
        { id: "staff-name", label: "Full Name", placeholder: "Enter staff name", value: name, onChange: onNameChange, type: "text" },
        { id: "staff-phone", label: "Phone Number", placeholder: "+91 98765 43210", value: phone, onChange: onPhoneChange, type: "tel" },
        { id: "staff-empid", label: "Employee ID", placeholder: "EMP-XXXX", value: empId, onChange: onEmpIdChange, type: "text" },
      ].map(({ id, label, placeholder, value, onChange, type }) => (
        <div key={id} className="flex flex-col gap-2">
          <Label htmlFor={id}>{label}</Label>
          <Input id={id} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <Label htmlFor="staff-dept">Department</Label>
        <Select value={dept} onValueChange={onDeptChange}>
          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
          <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {showPasswordField && onPasswordChange && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="staff-password">Password</Label>
          <Input id="staff-password" type="password" placeholder="Leave empty for password123" value={password ?? ""} onChange={(e) => onPasswordChange(e.target.value)} />
          <p className="text-xs text-muted-foreground">Share this with staff. They can change it later from Profile.</p>
        </div>
      )}
    </div>
  )
}

function StaffStatusBadge({ status }: { status: StaffStatus }) {
  const config: Record<StaffStatus, { label: string; className: string }> = {
    available: { label: "Available", className: "bg-success/15 text-success border-success/30" },
    busy: { label: "Busy", className: "bg-warning/15 text-warning border-warning/30" },
    "off-duty": { label: "Off Duty", className: "bg-muted text-muted-foreground border-border" },
    "on-leave": { label: "On Leave", className: "bg-primary/15 text-primary border-primary/30" },
  }
  const c = config[status]
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>
}

function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  const config: Record<LeaveRequestStatus, { label: string; className: string; icon: React.ElementType }> = {
    pending: { label: "Pending", className: "bg-warning/15 text-warning-foreground border-warning/30", icon: Clock },
    approved: { label: "Approved", className: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
    rejected: { label: "Rejected", className: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
  }
  const c = config[status]
  const Icon = c.icon
  return <Badge variant="outline" className={cn("gap-1", c.className)}><Icon className="h-3 w-3" />{c.label}</Badge>
}
