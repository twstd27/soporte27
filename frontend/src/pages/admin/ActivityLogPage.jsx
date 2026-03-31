import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getActivityLogs } from '@/api/activity_logs.api'
import { getUsers } from '@/api/users.api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import { Empty } from '@/components/ui/empty'
import { X, ScrollText } from 'lucide-react'

const ACTION_LABELS = {
  ticket_created:        { label: 'Ticket creado',          variant: 'default' },
  ticket_status_changed: { label: 'Estado cambiado',        variant: 'secondary' },
  ticket_deleted:        { label: 'Ticket eliminado',       variant: 'destructive' },
  brand_created:         { label: 'Marca creada',           variant: 'default' },
  brand_updated:         { label: 'Marca actualizada',      variant: 'secondary' },
  brand_deleted:         { label: 'Marca eliminada',        variant: 'destructive' },
  brand_restored:        { label: 'Marca restaurada',       variant: 'outline' },
  supplier_created:      { label: 'Proveedor creado',       variant: 'default' },
  supplier_updated:      { label: 'Proveedor actualizado',  variant: 'secondary' },
  supplier_deleted:      { label: 'Proveedor eliminado',    variant: 'destructive' },
  supplier_restored:     { label: 'Proveedor restaurado',   variant: 'outline' },
  support_type_created:  { label: 'Tipo creado',            variant: 'default' },
  support_type_updated:  { label: 'Tipo actualizado',       variant: 'secondary' },
  support_type_deleted:  { label: 'Tipo eliminado',         variant: 'destructive' },
  support_type_restored: { label: 'Tipo restaurado',        variant: 'outline' },
  user_created:          { label: 'Usuario creado',         variant: 'default' },
  user_activated:        { label: 'Usuario activado',       variant: 'outline' },
  user_deactivated:      { label: 'Usuario desactivado',    variant: 'destructive' },
}

const ENTITY_LABELS = {
  ticket:       'Ticket',
  brand:        'Marca',
  supplier:     'Proveedor',
  support_type: 'Tipo de Soporte',
  user:         'Usuario',
}

function EntityLink({ type, id, label }) {
  if (!type || !id) return <span className="text-muted-foreground">—</span>
  const href = type === 'ticket' ? `/tickets/${id}` : null
  if (href) return <Link to={href} className="underline underline-offset-2 hover:text-primary">{label}</Link>
  return <span>{label}</span>
}

export default function ActivityLogPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ date_from: '', date_to: '', user_id: '', entity_type: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, filters],
    queryFn: () => getActivityLogs({
      page,
      per_page: 50,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    }).then((r) => r.data),
    keepPreviousData: true,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers().then((r) => r.data.data ?? r.data),
  })
  const users = Array.isArray(usersData) ? usersData : (usersData?.data ?? [])

  const logs  = data?.data ?? []
  const meta  = data?.meta ?? {}

  const setFilter = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1) }
  const clearFilters = () => { setFilters({ date_from: '', date_to: '', user_id: '', entity_type: '' }); setPage(1) }
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bitácora de Eventos</h1>
        <p className="text-muted-foreground">Registro de acciones realizadas en el sistema</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Field className="w-40">
          <FieldLabel>Desde</FieldLabel>
          <Input type="date" value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} />
        </Field>
        <Field className="w-40">
          <FieldLabel>Hasta</FieldLabel>
          <Input type="date" value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} />
        </Field>
        <Field className="w-44">
          <FieldLabel>Usuario</FieldLabel>
          <Select value={filters.user_id || 'all'} onValueChange={(v) => setFilter('user_id', v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Todos</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-48">
          <FieldLabel>Entidad</FieldLabel>
          <Select value={filters.entity_type || 'all'} onValueChange={(v) => setFilter('entity_type', v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Todas</SelectItem>
                {Object.entries(ENTITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="gap-1 mb-0.5" onClick={clearFilters}>
            <X className="size-3.5" />Limpiar
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Fecha</TableHead>
              <TableHead className="w-36">Usuario</TableHead>
              <TableHead className="w-44">Acción</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-36">Entidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {[1,2,3,4,5].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-4">
                  <Empty icon={ScrollText} title="Sin eventos registrados" description="0 registros · No hay actividad en el período seleccionado" />
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const action = ACTION_LABELS[log.action] ?? { label: log.action, variant: 'outline' }
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.user?.name ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={action.variant} className="text-xs">{action.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.description}</TableCell>
                    <TableCell className="text-sm">
                      <EntityLink type={log.entity_type} id={log.entity_id} label={log.entity_label} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total: {meta.total} eventos</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <span>Página {meta.current_page} de {meta.last_page}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  )
}
