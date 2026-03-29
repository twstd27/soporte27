import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Wrench, Users, BarChart3, UserCog, Tag, Settings, Building2, Bookmark, Truck, Layers, Plus, ScrollText } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

const mainItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/tickets', icon: Wrench, label: 'Tickets de Soporte' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
]

const adminItems = [
  { to: '/users', icon: UserCog, label: 'Usuarios' },
  { to: '/admin/categories', icon: Tag, label: 'Categorías' },
  { to: '/admin/brands', icon: Bookmark, label: 'Marcas' },
  { to: '/admin/suppliers', icon: Truck, label: 'Proveedores' },
  { to: '/admin/support-types', icon: Layers, label: 'Tipos de Soporte' },
  { to: '/admin/activity', icon: ScrollText, label: 'Bitácora' },
  { to: '/admin/settings', icon: Settings, label: 'Parámetros' },
  { to: '/admin/company', icon: Building2, label: 'Empresa' },
]

function NavItem({ to, icon: Icon, label, exact, onNavigate }) {
  return (
    <SidebarMenuItem>
      <NavLink
        to={to}
        end={exact}
        onClick={onNavigate}
        className={({ isActive }) => cn('w-full', isActive && 'data-active')}
      >
        {({ isActive }) => (
          <SidebarMenuButton isActive={isActive}>
            <Icon />
            <span>{label}</span>
          </SidebarMenuButton>
        )}
      </NavLink>
    </SidebarMenuItem>
  )
}

const ROLE_LABELS = { admin: 'Administrador', technician: 'Técnico' }

export default function AppSidebar() {
  const user = useAuthStore((s) => s.user)
  const company = useAppStore((s) => s.company)
  const isAdmin = user?.role === 'admin'
  const { isMobile, setOpenMobile } = useSidebar()
  const navigate = useNavigate()

  const handleNavigate = () => {
    if (isMobile) setOpenMobile(false)
  }

  const handleNewTicket = () => {
    handleNavigate()
    navigate('/tickets/new')
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name ?? 'Logo'}
              className="h-8 max-w-[32px] object-contain shrink-0"
            />
          ) : (
            <Building2 className="size-6 shrink-0 text-sidebar-foreground/70" />
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              {company?.name ?? 'Centro de Soporte'}
            </span>
            <span className="text-xs text-sidebar-foreground/60">Herramientas Industriales</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-3 py-2">
          <Button className="w-full gap-2" onClick={handleNewTicket}>
            <Plus className="size-4" />
            Nuevo Ticket
          </Button>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems
                .filter((item) => item.to !== '/reports' || isAdmin)
                .map((item) => <NavItem key={item.to} {...item} onNavigate={handleNavigate} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => <NavItem key={item.to} {...item} onNavigate={handleNavigate} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.name ?? 'Usuario'}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {ROLE_LABELS[user?.role] ?? 'Técnico'}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
