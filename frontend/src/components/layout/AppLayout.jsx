import { useEffect } from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { useAppStore } from '@/store/appStore'
import AppSidebar from './AppSidebar'
import AppHeader from './AppHeader'

export default function AppLayout() {
  const loadConfig = useAppStore((s) => s.loadConfig)
  const loaded = useAppStore((s) => s.loaded)
  const company = useAppStore((s) => s.company)
  const matches = useMatches()

  useEffect(() => {
    if (!loaded) loadConfig()
  }, [])

  useEffect(() => {
    const routeTitle = [...matches].reverse().find((m) => m.handle?.title)?.handle?.title
    const siteName = company?.name ?? 'Centro de Soporte'
    document.title = routeTitle ? `${siteName} | ${routeTitle}` : siteName
  }, [matches, company?.name])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
