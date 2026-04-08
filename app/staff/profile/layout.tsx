// Force dynamic rendering for profile - prevents 404 on Vercel
export const dynamic = "force-dynamic"

export default function StaffProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
