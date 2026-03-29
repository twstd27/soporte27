import { Moon, Sun, LogOut, ChevronDown, Building2 } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useAppStore } from '@/store/appStore'
import { logout } from '@/api/auth.api'
import { useQueryClient } from '@tanstack/react-query'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function AppHeader() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { isDark, toggleTheme } = useThemeStore()
  const company = useAppStore((s) => s.company)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { open, isMobile } = useSidebar()

  // On mobile the sidebar is always a sheet (overlay) so it never occupies layout space.
  // On desktop show logo only when sidebar is collapsed.
  const showLogoInHeader = isMobile || !open

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // ignore
    } finally {
      clearAuth()
      qc.clear()
      // Reset loaded flag so config reloads on next login
      useAppStore.setState({ loaded: false, company: null })
      navigate('/login')
      toast.success('Sesión cerrada correctamente')
    }
  }

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />

      {/* Centered logo/brand — visible only when sidebar is hidden */}
      {showLogoInHeader && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none select-none">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name ?? 'Logo'}
              className="h-7 max-w-[120px] object-contain"
            />
          ) : (
            <>
              <Building2 className="size-5 text-muted-foreground" />
              <span className="font-semibold text-sm truncate max-w-[160px]">
                {company?.name ?? 'Centro de Soporte'}
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex flex-1 items-center justify-end gap-2">
        <NotificationBell />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Cambiar tema"
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-sm">
                {user?.email ?? user?.name ?? 'Usuario'}
              </span>
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut data-icon="inline-start" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
