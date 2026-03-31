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
        <footer className="px-4 lg:px-6 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>v{__APP_VERSION__}</span>
          <span>Desarrollado por <a href="https://wa.me/59167349376" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">Rx</a></span>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
