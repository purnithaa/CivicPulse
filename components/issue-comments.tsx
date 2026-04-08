"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { apiUrl } from "@/lib/api-base"

interface Comment {
  id: string
  issue_id: string
  author_name: string
  author_role: string
  message: string
  image_url?: string | null
  created_at: string
}

function timeAgo(dateStr: string) {
  const ts = new Date(dateStr).getTime()
  if (isNaN(ts)) return "—"
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const roleColors: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  staff: "bg-accent/15 text-accent",
  citizen: "bg-muted text-muted-foreground",
}

interface IssueCommentsProps {
  issueId: string
  authorName?: string
  authorRole?: "citizen" | "staff" | "admin"
  readOnly?: boolean
}

export function IssueComments({
  issueId,
  authorName = "User",
  authorRole = "citizen",
  readOnly = false,
}: IssueCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/issue-comments?issueId=${encodeURIComponent(issueId)}`))
      const data = await res.json()
      if (Array.isArray(data)) setComments(data)
    } catch {}
    setLoading(false)
  }, [issueId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(apiUrl("/api/issue-comments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          authorName,
          authorRole,
          message: message.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed to post comment")
      const newComment = await res.json()
      setComments((prev) => [...prev, newComment])
      setMessage("")
      toast.success("Comment posted")
    } catch (err) {
      toast.error("Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        Updates & Comments
        {comments.length > 0 && (
          <span className="ml-auto text-xs font-normal normal-case text-muted-foreground">
            {comments.length}
          </span>
        )}
      </h4>

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-3">
          No updates yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground uppercase">
                {comment.author_name?.slice(0, 2) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{comment.author_name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${roleColors[comment.author_role] ?? roleColors.citizen}`}>
                    {comment.author_role}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm text-foreground leading-relaxed">{comment.message}</p>
                {comment.image_url && (
                  <div className="mt-2 overflow-hidden rounded-md border border-border">
                    <img
                      src={comment.image_url}
                      alt="Attachment"
                      className="max-h-40 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      {!readOnly && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <Textarea
            placeholder="Add an update or comment..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-16 resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={submitting || !message.trim()}
            className="h-auto shrink-0"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
