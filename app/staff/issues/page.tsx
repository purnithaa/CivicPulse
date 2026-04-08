"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  CheckCircle2,
  MapPin,
  Clock,
  Camera,
  ImageIcon,
  X,
  Send,
  Loader2,
  RefreshCw,
  Navigation,
  Phone,
  User,
} from "lucide-react"
import { useStaffAuth } from "@/lib/staff-auth-context"
import { apiUrl } from "@/lib/api-base"
import { categoryLabels, priorityLabels } from "@/lib/mock-data"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { CategoryIcon } from "@/components/category-icon"
import { cn } from "@/lib/utils"

// Normalized issue type that works with both API and mock data
interface NormalizedIssue {
  id: string
  title: string
  description?: string
  category: string
  status: string
  priority: string
  location: string
  lat?: number | null
  lng?: number | null
  reportedAt: string
  assignedStaffName?: string
  assignedStaffId?: string
  resolvedImageUrl?: string
  imageUrl?: string
  reporterName?: string
  reporterContact?: string
}

type TabFilter = "active" | "resolved" | "all"

function normalizeIssue(raw: any): NormalizedIssue {
  return {
    id: raw.id,
    title: raw.title ?? "",
    description: raw.description ?? "",
    category: raw.category ?? "other",
    status: raw.status ?? "submitted",
    priority: raw.priority ?? "medium",
    location: raw.location ?? "",
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    reportedAt: raw.reported_at ?? raw.reportedAt ?? "",
    assignedStaffName: raw.assigned_staff_name ?? raw.assignedStaff?.name,
    assignedStaffId: raw.assigned_staff_id ?? raw.assignedStaff?.id,
    resolvedImageUrl: raw.resolved_image_url ?? raw.resolvedImageUrl,
    imageUrl: raw.image_url ?? undefined,
    reporterName: raw.reporter_name ?? undefined,
    reporterContact: raw.reporter_contact ?? undefined,
  }
}

interface ApiComment {
  id: string
  issue_id: string
  author_name: string
  author_role: string
  message: string
  image_url?: string | null
  created_at: string
}

export default function StaffIssuesPage() {
  const { staffUser, updateStaffStatus, updateStaffStats } = useStaffAuth()
  const [issues, setIssues] = useState<NormalizedIssue[]>([])
  const [detailComments, setDetailComments] = useState<ApiComment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabFilter>("active")
  const [selectedIssue, setSelectedIssue] = useState<NormalizedIssue | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isResolveOpen, setIsResolveOpen] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const [resolveNote, setResolveNote] = useState("")
  const [resolvePhoto, setResolvePhoto] = useState<string | null>(null)
  const [updatePhoto, setUpdatePhoto] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const resolveFileRef = useRef<HTMLInputElement>(null)
  const updateFileRef = useRef<HTMLInputElement>(null)

  const loadIssues = useCallback(async () => {
    if (!staffUser) return
    setLoading(true)
    try {
      const res = await fetch(apiUrl("/api/issues"))
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      if (Array.isArray(data)) {
        const normalized = data.map(normalizeIssue)
        setIssues(normalized)
      }
    } catch {
      // silently use empty list — no mock fallback needed
    } finally {
      setLoading(false)
    }
  }, [staffUser])

  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  // Filter issues assigned to this staff member (match by name OR by id)
  const assignedIssues = useMemo(
    () =>
      issues.filter(
        (i) =>
          (staffUser?.name && i.assignedStaffName === staffUser.name) ||
          (staffUser?.id && i.assignedStaffId === staffUser.id)
      ),
    [issues, staffUser?.name, staffUser?.id]
  )

  const filteredIssues = useMemo(() => {
    switch (tab) {
      case "active":
        return assignedIssues.filter((i) => i.status === "dispatched")
      case "resolved":
        return assignedIssues.filter((i) => i.status === "resolved")
      default:
        return assignedIssues
    }
  }, [assignedIssues, tab])

  const activeCount = assignedIssues.filter((i) => i.status === "dispatched").length
  const resolvedCount = assignedIssues.filter((i) => i.status === "resolved").length

  const loadDetailComments = useCallback(async (issueId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/issue-comments?issueId=${encodeURIComponent(issueId)}`))
      const data = await res.json()
      setDetailComments(Array.isArray(data) ? data : [])
    } catch {
      setDetailComments([])
    }
  }, [])

  useEffect(() => {
    if (selectedIssue) loadDetailComments(selectedIssue.id)
    else setDetailComments([])
  }, [selectedIssue?.id, loadDetailComments])

  const issueUpdatesSorted = useMemo(
    () =>
      [...detailComments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [detailComments]
  )

  const uploadBlobUrlToStorage = useCallback(async (blobUrl: string): Promise<string> => {
    const res = await fetch(blobUrl)
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(blob)
    })
    const uploadRes = await fetch(apiUrl("/api/upload"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64: dataUrl,
        fileName: "photo.jpg",
        contentType: blob.type || "image/jpeg",
      }),
    })
    const uploadData = await uploadRes.json()
    if (uploadData.url) return uploadData.url
    throw new Error("Upload failed")
  }, [])

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setter(url)
  }

  const handleSendUpdate = async () => {
    if (!selectedIssue || !staffUser || !updateMessage.trim()) {
      toast.error("Please enter an update message")
      return
    }
    setSubmitting(true)
    try {
      let imageUrl: string | null = null
      if (updatePhoto) {
        try {
          imageUrl = await uploadBlobUrlToStorage(updatePhoto)
        } catch {
          toast.error("Photo upload failed — posting without photo")
        }
      }
      const res = await fetch(apiUrl("/api/issue-comments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: selectedIssue.id,
          authorName: staffUser.name,
          authorRole: "staff",
          message: updateMessage.trim(),
          imageUrl,
        }),
      })
      if (!res.ok) throw new Error("Failed to post")
      setUpdateMessage("")
      setUpdatePhoto(null)
      if (updateFileRef.current) updateFileRef.current.value = ""
      await loadDetailComments(selectedIssue.id)
      toast.success("Progress update posted")
    } catch {
      toast.error("Failed to post update")
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async () => {
    if (!selectedIssue || !staffUser) return
    if (!resolveNote.trim()) {
      toast.error("Please add a resolution note")
      return
    }

    setSubmitting(true)
    try {
      let imageUrl: string | null = null
      if (resolvePhoto) {
        try {
          imageUrl = await uploadBlobUrlToStorage(resolvePhoto)
        } catch {
          toast.error("Photo upload failed — saving resolution without photo")
        }
      }
      const commentRes = await fetch(apiUrl("/api/issue-comments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: selectedIssue.id,
          authorName: staffUser.name,
          authorRole: "staff",
          message: `[RESOLVED] ${resolveNote.trim()}`,
          imageUrl,
        }),
      })
      if (!commentRes.ok) throw new Error("Failed to save resolution note")

      const res = await fetch(apiUrl(`/api/issues/${selectedIssue.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      })

      setIssues((prev) =>
        prev.map((i) =>
          i.id === selectedIssue.id ? { ...i, status: "resolved" } : i
        )
      )

      const newActiveCount = activeCount - 1
      updateStaffStats({
        activeIssues: Math.max(0, newActiveCount),
        resolvedCount: (staffUser.resolvedCount || 0) + 1,
      })

      setIsResolveOpen(false)
      setIsDetailOpen(false)
      setResolveNote("")
      setResolvePhoto(null)
      if (resolveFileRef.current) resolveFileRef.current.value = ""
      await loadDetailComments(selectedIssue.id)
      setSelectedIssue(null)

      toast.success("Issue marked as resolved")

      if (!res.ok) {
        toast.warning("Status saved locally — sync with server may be delayed")
      }

      if (newActiveCount === 0) {
        toast.info("All issues resolved! Consider setting your status to Available.", {
          action: {
            label: "Set Available",
            onClick: () => updateStaffStatus("available"),
          },
        })
      }
    } catch {
      toast.error("Failed to update issue status")
    } finally {
      setSubmitting(false)
    }
  }

  const openDetail = (issue: NormalizedIssue) => {
    setSelectedIssue(issue)
    setUpdateMessage("")
    setUpdatePhoto(null)
    setIsDetailOpen(true)
  }

  if (!staffUser) return null

  const tabs: { value: TabFilter; label: string; count: number }[] = [
    { value: "active", label: "Active", count: activeCount },
    { value: "resolved", label: "Resolved", count: resolvedCount },
    { value: "all", label: "All", count: assignedIssues.length },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-foreground lg:text-3xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            My Issues
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage issues assigned to you
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadIssues}
          disabled={loading}
          className="gap-1.5 shrink-0"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === t.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            <span
              className={cn(
                "ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                tab === t.value
                  ? "bg-accent/15 text-accent"
                  : "bg-muted-foreground/15 text-muted-foreground"
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredIssues.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {tab === "active"
                ? "No active issues assigned to you."
                : tab === "resolved"
                  ? "No resolved issues yet."
                  : "No issues assigned to you."}
            </p>
            {assignedIssues.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Issues assigned to <strong>{staffUser.name}</strong> by the admin will appear here.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredIssues.map((issue) => (
            <Card
              key={issue.id}
              className="border-border bg-card cursor-pointer transition-colors hover:bg-muted/30"
              onClick={() => openDetail(issue)}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <CategoryIcon category={issue.category as any} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {issue.title}
                    </p>
                    <PriorityBadge priority={issue.priority as any} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {issue.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {issue.reportedAt
                        ? new Date(issue.reportedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={issue.status as any} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Issue Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle
                  className="text-lg"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {selectedIssue.title}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                {/* Issue info */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedIssue.status as any} />
                  <PriorityBadge priority={selectedIssue.priority as any} />
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[selectedIssue.category as any] ?? selectedIssue.category}
                  </Badge>
                </div>

                {selectedIssue.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedIssue.description}
                  </p>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {selectedIssue.lat != null && selectedIssue.lng != null ? (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIssue.lat},${selectedIssue.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:no-underline"
                      >
                        {selectedIssue.location}
                      </a>
                    ) : (
                      selectedIssue.location
                    )}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Reported{" "}
                    {selectedIssue.reportedAt
                      ? new Date(selectedIssue.reportedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                </div>

                {/* Google Maps — open with directions / navigation */}
                {selectedIssue.lat && selectedIssue.lng && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIssue.lat},${selectedIssue.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Navigation className="h-3.5 w-3.5" />
                      Navigate to issue location
                    </Button>
                  </a>
                )}

                {/* Issue Photo */}
                {selectedIssue.imageUrl && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue Photo</p>
                    <div className="overflow-hidden rounded-lg border border-border">
                      <img
                        src={selectedIssue.imageUrl}
                        alt="Issue photo"
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Reporter Info */}
                {(selectedIssue.reporterName || selectedIssue.reporterContact) && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reported By</p>
                    <div className="flex flex-col gap-1.5">
                      {selectedIssue.reporterName && (
                        <span className="flex items-center gap-2 text-sm text-foreground">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {selectedIssue.reporterName}
                        </span>
                      )}
                      {selectedIssue.reporterContact && (
                        <a
                          href={`tel:${selectedIssue.reporterContact.replace(/\s/g, "")}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {selectedIssue.reporterContact}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Progress updates & comments (from API — visible to citizen & admin too) */}
                <div className="border-t border-border pt-4">
                  <h3
                    className="mb-3 text-sm font-bold text-foreground"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Progress Updates
                  </h3>
                  {issueUpdatesSorted.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No updates yet. Post your first progress note below.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {issueUpdatesSorted.map((upd) => (
                        <div
                          key={upd.id}
                          className="rounded-lg border border-border bg-muted/50 p-3"
                        >
                          <p className="text-sm text-foreground">{upd.message}</p>
                          {upd.image_url && (
                            <div className="mt-2 overflow-hidden rounded-md border border-border">
                              <img
                                src={upd.image_url}
                                alt="Update photo"
                                className="h-32 w-full object-cover"
                              />
                            </div>
                          )}
                          <p className="mt-1.5 text-[10px] text-muted-foreground">
                            {new Date(upd.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {upd.author_name && (
                              <> · {upd.author_name}</>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post update (only for active issues) */}
                {selectedIssue.status === "dispatched" && (
                  <div className="border-t border-border pt-4">
                    <Label className="mb-2 text-sm font-medium">Post an Update</Label>
                    <div className="flex flex-col gap-2">
                      <Textarea
                        placeholder="Describe your progress..."
                        value={updateMessage}
                        onChange={(e) => setUpdateMessage(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      {updatePhoto && (
                        <div className="relative inline-block">
                          <img
                            src={updatePhoto}
                            alt="Attached photo"
                            className="h-20 w-20 rounded-md border border-border object-cover"
                          />
                          <button
                            onClick={() => setUpdatePhoto(null)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={updateFileRef}
                          onChange={(e) => handleFileSelect(e, setUpdatePhoto)}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateFileRef.current?.click()}
                          className="gap-1.5"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Photo
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSendUpdate}
                          disabled={!updateMessage.trim() || submitting}
                          className="ml-auto gap-1.5"
                        >
                          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resolve button */}
                {selectedIssue.status === "dispatched" && (
                  <Button
                    className="w-full gap-2 bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => setIsResolveOpen(true)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-heading)" }}>
              Resolve Issue
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Resolution Note</Label>
              <Textarea
                placeholder="Describe how the issue was resolved..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>After Photo (optional)</Label>
              {resolvePhoto ? (
                <div className="relative inline-block">
                  <img
                    src={resolvePhoto}
                    alt="After photo"
                    className="h-32 w-full rounded-md border border-border object-cover"
                  />
                  <button
                    onClick={() => setResolvePhoto(null)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => resolveFileRef.current?.click()}
                  className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">Upload after photo</span>
                  </div>
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                ref={resolveFileRef}
                onChange={(e) => handleFileSelect(e, setResolvePhoto)}
                className="hidden"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleResolve}
              disabled={!resolveNote.trim() || submitting}
              className="gap-2 bg-success text-success-foreground hover:bg-success/90"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirm Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
