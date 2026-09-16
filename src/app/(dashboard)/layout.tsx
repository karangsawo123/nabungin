import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import type { WorkspaceMembership } from '@/components/groups/workspace-switcher'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch Workspaces / Groups
  const { data: membershipsData } = await supabase
    .from('group_members')
    .select('role, groups (*)')
    .eq('user_id', user.id)

  const memberships = (membershipsData || []) as unknown as WorkspaceMembership[]

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      {/* Desktop Sidebar */}
      <Sidebar profile={profile} email={user.email} />

      {/* Main App Container */}
      <div className="flex flex-col flex-1 md:pl-64 min-w-0">
        {/* Sticky Topbar */}
        <Topbar
          profile={profile}
          email={user.email}
          memberships={memberships}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  )
}
