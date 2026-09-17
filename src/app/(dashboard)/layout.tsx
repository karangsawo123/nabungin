import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { AiAdvisorDrawer } from '@/components/ai/ai-advisor-drawer'
import { WorkspaceProvider, type WorkspaceMembership } from '@/components/groups/workspace-context'

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

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Fetch Workspaces / Groups yang dimiliki/diikuti user via group_members
  const { data: membershipsData } = await supabase
    .from('group_members')
    .select('role, groups (*)')
    .eq('user_id', user.id)

  const memberships = (membershipsData || []) as unknown as WorkspaceMembership[]

  // 3. Tentukan Active Workspace ID dengan prioritas keamanan:
  //    Pilihan user dari cookie -> Validasi terhadap membership riil -> Fallback ke Personal -> Fallback ke grup pertama
  const cookieStore = await cookies()
  const savedWorkspaceId = cookieStore.get('active_workspace_id')?.value

  const isSavedValid = memberships.some(
    (m) => m.groups && m.groups.id === savedWorkspaceId
  )

  let activeGroupId = ''
  if (isSavedValid && savedWorkspaceId) {
    activeGroupId = savedWorkspaceId
  } else {
    const personalGroup = memberships.find((m) => m.groups?.type === 'personal')
    activeGroupId = personalGroup?.groups?.id || memberships[0]?.groups?.id || ''
  }

  return (
    <WorkspaceProvider
      initialMemberships={memberships}
      initialActiveGroupId={activeGroupId}
    >
      <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
        {/* Desktop Sidebar */}
        <Sidebar profile={profile} email={user.email} />

        {/* Main App Container */}
        <div className="flex flex-col flex-1 md:pl-64 min-w-0">
          {/* Sticky Topbar */}
          <Topbar profile={profile} email={user.email} />

          {/* Dynamic Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNav />

        {/* Floating Global AI Financial Advisor Drawer */}
        <AiAdvisorDrawer />
      </div>
    </WorkspaceProvider>
  )
}
