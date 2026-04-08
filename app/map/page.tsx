"use client"

import { useState, useEffect } from "react"
import { CitizenHeader } from "@/components/citizen-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { StatusBadge, PriorityBadge } from "@/components/status-badge"
import { CategoryIcon } from "@/components/category-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  MapPin,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { categoryLabels, statusLabels, type IssueCategory, type IssueStatus } from "@/lib/mock-data"
import { apiUrl } from "@/lib/api-base"
import { useLanguage } from "@/lib/language-context"
import type { TranslationKey } from "@/lib/translations"

// Color mapping for categories
const categoryColors: Record<string, string> = {
  pothole: "#ef4444",
  streetlight: "#f59e0b",
  sanitation: "#22c55e",
  water: "#3b82f6",
  traffic: "#8b5cf6",
  vandalism: "#f97316",
  other: "#6b7280",
}

const statusColors: Record<string, string> = {
  submitted: "#6b7280",
  "in-review": "#f59e0b",
  dispatched: "#3b82f6",
  resolved: "#22c55e",
}

interface MapIssue {
  id: string
  title: string
  category: string
  status: string
  priority: string
  location: string
  lat?: number | null
  lng?: number | null
  reported_at?: string
  department?: string
}

const statusToTrKey: Record<string, TranslationKey> = {
  submitted: "submitted",
  "in-review": "inReview",
  dispatched: "dispatched",
  resolved: "resolved",
}

export default function MapPage() {
  const { t } = useLanguage()
  const [issues, setIssues] = useState<MapIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedIssue, setSelectedIssue] = useState<MapIssue | null>(null)

  useEffect(() => {
    fetch(apiUrl("/api/issues"))
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setIssues(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = issues.filter((issue) => {
    if (statusFilter !== "all" && issue.status !== statusFilter) return false
    if (categoryFilter !== "all" && issue.category !== categoryFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (
        !issue.title?.toLowerCase().includes(q) &&
        !issue.location?.toLowerCase().includes(q) &&
        !issue.id?.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  // Issues with coordinates
  const geoIssues = filtered.filter((i) => i.lat && i.lng)
  // Issues without coordinates
  const noGeoIssues = filtered.filter((i) => !i.lat || !i.lng)

  return (
    <div className="min-h-screen bg-background">
      <CitizenHeader />
      <main className="mx-auto max-w-7xl px-4 pb-24 md:pb-8">
        <div className="mt-6 mb-4">
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {t("mapTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("mapSubtitle")}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchIssues")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={t("statusFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="submitted">{t("submitted")}</SelectItem>
              <SelectItem value="in-review">{t("inReview")}</SelectItem>
              <SelectItem value="dispatched">{t("dispatched")}</SelectItem>
              <SelectItem value="resolved">{t("resolved")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t("categoryFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {(Object.keys(categoryLabels) as IssueCategory[]).map((k) => (
                <SelectItem key={k} value={k}>{t(`category${k.charAt(0).toUpperCase() + k.slice(1)}` as TranslationKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Info: no embedded map to avoid 429 from OpenStreetMap; open in Google Maps instead */}
        <div className="flex gap-4 flex-col lg:flex-row">
          <div className="flex-1 rounded-xl overflow-hidden border border-border bg-muted/30">
            {selectedIssue?.lat && selectedIssue?.lng ? (
              <div className="flex flex-col h-full min-h-64">
                <div className="flex items-center justify-between p-3 bg-card border-b border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryIcon category={selectedIssue.category as IssueCategory} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{selectedIssue.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{selectedIssue.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={selectedIssue.status as IssueStatus} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 h-7 text-xs"
                      asChild
                    >
                      <a
                        href={`https://www.google.com/maps?q=${selectedIssue.lat},${selectedIssue.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("googleMaps")}
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedIssue(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 p-6 text-center bg-muted/20">
                  <MapPin className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("mapRateLimitMessage")}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2" asChild>
                    <a
                      href={`https://www.google.com/maps?q=${selectedIssue.lat},${selectedIssue.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("googleMaps")}
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center px-6">
                <MapPin className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  {t("selectIssueToView")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("issuesWithGpsHint")}
                </p>
                {geoIssues.length === 0 && !loading && (
                  <p className="mt-2 text-xs text-warning font-medium">
                    {t("noIssuesWithGps")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Issue list panel */}
          <div className="lg:w-80 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">{t("noIssuesFound")}</p>
              </div>
            ) : (
              filtered.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className={`w-full rounded-xl border text-left p-3 transition-all ${
                    selectedIssue?.id === issue.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status color dot */}
                    <div
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: statusColors[issue.status] ?? "#6b7280" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{issue.title}</p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">
                          {categoryLabels[issue.category as IssueCategory] ?? issue.category}
                        </span>
                        {issue.lat && issue.lng ? (
                          <Badge variant="outline" className="h-4 px-1 text-[9px] bg-success/10 text-success border-success/30">
                            📍 GPS
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="h-4 px-1 text-[9px] text-muted-foreground">
                            No GPS
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />{issue.location}
                      </p>
                    </div>
                    <StatusBadge status={issue.status as IssueStatus} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("statusFilter")}</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-muted-foreground">{statusToTrKey[status] ? t(statusToTrKey[status]) : status.replace("-", " ")}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">
              {geoIssues.length} of {filtered.length} {t("issuesHaveGps")}
            </p>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  )
}
