import { mockIssues } from "@/lib/mock-data"
import { IssueCard } from "@/components/issue-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function RecentIssuesFeed() {
  const recentIssues = mockIssues
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Recent Reports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest issues reported in your area
          </p>
        </div>
        <Link href="/my-reports">
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {recentIssues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  )
}
