import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import TicketsPage from '@/pages/tickets/TicketsPage'
import NewTicketPage from '@/pages/tickets/NewTicketPage'
import TicketDetailPage from '@/pages/tickets/TicketDetailPage'
import CustomersPage from '@/pages/customers/CustomersPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import UsersPage from '@/pages/users/UsersPage'
import CategoriesPage from '@/pages/admin/CategoriesPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import CompanyPage from '@/pages/admin/CompanyPage'
import BrandsPage from '@/pages/admin/BrandsPage'
import SuppliersPage from '@/pages/admin/SuppliersPage'
import SupportTypesPage from '@/pages/admin/SupportTypesPage'
import ActivityLogPage from '@/pages/admin/ActivityLogPage'
import ThermalPrintPage from '@/pages/tickets/ThermalPrintPage'

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

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    handle: { title: 'Iniciar sesión' },
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: 'tickets/:id/print', element: <ThermalPrintPage />, handle: { title: 'Imprimir Ticket' } },
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage />, handle: { title: 'Dashboard' } },
          { path: 'tickets', element: <TicketsPage />, handle: { title: 'Tickets' } },
          { path: 'tickets/new', element: <NewTicketPage />, handle: { title: 'Nuevo Ticket' } },
          { path: 'tickets/:id', element: <TicketDetailPage />, handle: { title: 'Detalle de Ticket' } },
          { path: 'customers', element: <CustomersPage />, handle: { title: 'Clientes' } },
          {
            element: <AdminRoute />,
            children: [
              { path: 'reports', element: <ReportsPage />, handle: { title: 'Reportes' } },
              { path: 'users', element: <UsersPage />, handle: { title: 'Usuarios' } },
              { path: 'admin/categories', element: <CategoriesPage />, handle: { title: 'Categorías' } },
              { path: 'admin/settings', element: <SettingsPage />, handle: { title: 'Parámetros' } },
              { path: 'admin/company', element: <CompanyPage />, handle: { title: 'Empresa' } },
              { path: 'admin/brands', element: <BrandsPage />, handle: { title: 'Marcas' } },
              { path: 'admin/suppliers', element: <SuppliersPage />, handle: { title: 'Proveedores' } },
              { path: 'admin/support-types', element: <SupportTypesPage />, handle: { title: 'Tipos de Soporte' } },
              { path: 'admin/activity', element: <ActivityLogPage />, handle: { title: 'Bitácora' } },
            ],
          },
        ],
      },
    ],
  },
])
