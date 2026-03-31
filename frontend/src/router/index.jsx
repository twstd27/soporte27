import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'

const LoginPage        = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage    = lazy(() => import('@/pages/dashboard/DashboardPage'))
const TicketsPage      = lazy(() => import('@/pages/tickets/TicketsPage'))
const NewTicketPage    = lazy(() => import('@/pages/tickets/NewTicketPage'))
const TicketDetailPage = lazy(() => import('@/pages/tickets/TicketDetailPage'))
const ThermalPrintPage = lazy(() => import('@/pages/tickets/ThermalPrintPage'))
const CustomersPage    = lazy(() => import('@/pages/customers/CustomersPage'))
const ReportsPage      = lazy(() => import('@/pages/reports/ReportsPage'))
const UsersPage        = lazy(() => import('@/pages/users/UsersPage'))
const CategoriesPage   = lazy(() => import('@/pages/admin/CategoriesPage'))
const SettingsPage     = lazy(() => import('@/pages/admin/SettingsPage'))
const CompanyPage      = lazy(() => import('@/pages/admin/CompanyPage'))
const BrandsPage       = lazy(() => import('@/pages/admin/BrandsPage'))
const SuppliersPage    = lazy(() => import('@/pages/admin/SuppliersPage'))
const SupportTypesPage = lazy(() => import('@/pages/admin/SupportTypesPage'))
const ActivityLogPage  = lazy(() => import('@/pages/admin/ActivityLogPage'))

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
    </div>
  )
}

function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminRoute() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}

const lazy_ = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>

export const router = createBrowserRouter([
  {
    path: '/login',
    element: lazy_(<LoginPage />),
    handle: { title: 'Iniciar sesión' },
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: 'tickets/:id/print', element: lazy_(<ThermalPrintPage />), handle: { title: 'Imprimir Ticket' } },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: lazy_(<DashboardPage />), handle: { title: 'Dashboard' } },
          { path: 'tickets', element: lazy_(<TicketsPage />), handle: { title: 'Tickets' } },
          { path: 'tickets/new', element: lazy_(<NewTicketPage />), handle: { title: 'Nuevo Ticket' } },
          { path: 'tickets/:id', element: lazy_(<TicketDetailPage />), handle: { title: 'Detalle de Ticket' } },
          { path: 'customers', element: lazy_(<CustomersPage />), handle: { title: 'Clientes' } },
          {
            element: <AdminRoute />,
            children: [
              { path: 'reports', element: lazy_(<ReportsPage />), handle: { title: 'Reportes' } },
              { path: 'users', element: lazy_(<UsersPage />), handle: { title: 'Usuarios' } },
              { path: 'admin/categories', element: lazy_(<CategoriesPage />), handle: { title: 'Categorías' } },
              { path: 'admin/settings', element: lazy_(<SettingsPage />), handle: { title: 'Parámetros' } },
              { path: 'admin/company', element: lazy_(<CompanyPage />), handle: { title: 'Empresa' } },
              { path: 'admin/brands', element: lazy_(<BrandsPage />), handle: { title: 'Marcas' } },
              { path: 'admin/suppliers', element: lazy_(<SuppliersPage />), handle: { title: 'Proveedores' } },
              { path: 'admin/support-types', element: lazy_(<SupportTypesPage />), handle: { title: 'Tipos de Soporte' } },
              { path: 'admin/activity', element: lazy_(<ActivityLogPage />), handle: { title: 'Bitácora' } },
            ],
          },
        ],
      },
    ],
  },
])
