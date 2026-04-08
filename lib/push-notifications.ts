/**
 * Browser Push Notifications utility for CivicPulse
 * Uses the Web Notifications API (no service worker needed for foreground notifications)
 */

const PERM_KEY = "civicpulse_notif_permission_asked"

/** Request notification permission from the user. Returns the result. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied"
  if (Notification.permission === "granted") return "granted"
  if (Notification.permission === "denied") return "denied"
  const perm = await Notification.requestPermission()
  return perm
}

/** Get current notification permission without asking */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported"
  return Notification.permission
}

/** Show a browser push notification */
export function showNotification(title: string, body: string, options?: {
  icon?: string
  badge?: string
  tag?: string
  onClick?: () => void
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return
  if (Notification.permission !== "granted") return

  const n = new Notification(title, {
    body,
    icon: options?.icon ?? "/icon-192.png",
    badge: options?.badge ?? "/icon-192.png",
    tag: options?.tag,
    requireInteraction: false,
  })

  if (options?.onClick) {
    n.onclick = () => {
      window.focus()
      options.onClick!()
      n.close()
    }
  }
}

/**
 * Notify about issue status changes.
 * Only fires browser notifications for IDs not already in seenIds.
 * After firing, saves the newly fired IDs to localStorage so they don't repeat.
 * @param issues - the citizen's issues from API
 * @param seenIds - Set of notification IDs already seen (from localStorage)
 * @param storageKey - localStorage key to persist newly seen IDs
 */
export function notifyIssueUpdates(
  issues: any[],
  seenIds: Set<string>,
  storageKey?: string
) {
  if (getNotificationPermission() !== "granted") return

  const newlySeen: string[] = []

  for (const issue of issues) {
    const id = issue.id
    const title = issue.title ?? "your issue"
    const status = issue.status

    if (!seenIds.has(`${id}-review`) && ["in-review", "dispatched", "resolved"].includes(status)) {
      showNotification("Issue Update — CivicPulse", `Your report "${title}" is now under review.`, {
        tag: `${id}-review`,
        onClick: () => { window.location.href = "/my-reports" },
      })
      newlySeen.push(`${id}-review`)
    }

    if (!seenIds.has(`${id}-dispatched`) && ["dispatched", "resolved"].includes(status)) {
      showNotification("Staff Dispatched — CivicPulse", `Staff has been dispatched to your report "${title}".`, {
        tag: `${id}-dispatched`,
        onClick: () => { window.location.href = "/my-reports" },
      })
      newlySeen.push(`${id}-dispatched`)
    }

    if (!seenIds.has(`${id}-resolved`) && status === "resolved") {
      showNotification("Issue Resolved — CivicPulse", `Your report "${title}" has been resolved!`, {
        tag: `${id}-resolved`,
        onClick: () => { window.location.href = "/my-reports" },
      })
      newlySeen.push(`${id}-resolved`)
    }
  }

  // Persist newly fired notification IDs to localStorage immediately
  // so they don't repeat on next page load
  if (newlySeen.length > 0 && storageKey) {
    try {
      const existing = new Set<string>(JSON.parse(localStorage.getItem(storageKey) ?? "[]"))
      for (const nid of newlySeen) existing.add(nid)
      localStorage.setItem(storageKey, JSON.stringify([...existing]))
    } catch { /* ignore */ }
  }
}

/** Check and ask for permission on first app load (once per session) */
export function askNotificationPermissionOnce() {
  if (typeof window === "undefined") return
  if (sessionStorage.getItem(PERM_KEY)) return
  sessionStorage.setItem(PERM_KEY, "1")
  if (getNotificationPermission() === "default") {
    // Small delay so it doesn't popup immediately on page load
    setTimeout(() => {
      requestNotificationPermission()
    }, 5000)
  }
}
