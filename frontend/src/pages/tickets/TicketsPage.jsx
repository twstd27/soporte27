import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Search, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Printer, Trash2, RotateCcw, Eye, EyeOff, ChevronRight as ChevronRightSm } from 'lucide-react'
import { getTickets, deleteTicket, updateTicketStatus, restoreTicket } from '@/api/tickets.api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { TICKET_STATUSES } from '@/utils/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

const STATUS_TRANSITIONS = {
  received:      ['diagnosing'],
  diagnosing:    ['in_repair', 'waiting_parts', 'ready'],
  in_repair:     ['waiting_parts', 'ready'],
  waiting_parts: ['in_repair', 'ready'],
  ready:         ['delivered'],
  delivered:     [],
}

const today = new Date().toISOString().split('T')[0]

function StatusBadge({ status, deleted }) {
  if (deleted) return <Badge variant="destructive">Eliminado</Badge>
  const statusInfo = TICKET_STATUSES[status]
  if (!statusInfo) return <Badge variant="secondary">{status}</Badge>
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
}

function TicketActions({ ticket }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actualDate, setActualDate] = useState(today)

  const statusMutation = useMutation({
    mutationFn: (data) => updateTicketStatus(ticket.id, data),
    onSuccess: () => {
      toast.success('Estado actualizado')
      qc.invalidateQueries({ queryKey: ['tickets'] })
      setDeliveryOpen(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al cambiar estado'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTicket(ticket.id),
    onSuccess: () => {
      toast.success('Ticket eliminado')
      qc.invalidateQueries({ queryKey: ['tickets'] })
      setDeleteOpen(false)
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al eliminar'),
  })

  const allowedTransitions = STATUS_TRANSITIONS[ticket.status] ?? []

  const handleStatusClick = (s) => {
    if (s === 'delivered') { setDeliveryOpen(true); return }
    statusMutation.mutate({ status: s })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {allowedTransitions.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Cambiar estado
              </DropdownMenuLabel>
              {allowedTransitions.map((s) => (
                <DropdownMenuItem key={s} onClick={() => handleStatusClick(s)}>
                  <ChevronRightSm className="size-3.5 text-muted-foreground" />
                  {TICKET_STATUSES[s]?.label ?? s}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => window.open(`/tickets/${ticket.id}/print`, '_blank')}>
            <Printer className="size-3.5" />
            Imprimir ticket
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" />
                Eliminar ticket
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar entrega</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel>Fecha de entrega real</FieldLabel>
            <Input
              type="date"
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => statusMutation.mutate({ status: 'delivered', actual_return_date: actualDate })}
              disabled={statusMutation.isPending}
            >
              Confirmar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el ticket <strong>{ticket.ticket_number}</strong>. Esta acción puede revertirse por un administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const PAGE_SIZE = 15

const columns = [
  {
    accessorKey: 'ticket_number',
    header: 'Nº Ticket',
    cell: ({ row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue('ticket_number')}
      </Link>
    ),
  },
  {
    id: 'tool',
    header: 'Herramienta',
    cell: ({ row }) => {
      const ticket = row.original
      return (
        <div className="flex flex-col gap-1">
          <span>{ticket.brand?.name ? `${ticket.brand.name} ` : ''}{ticket.model}</span>
          {ticket.support_type?.name && <Badge variant="outline" className="w-fit text-xs">{ticket.support_type.name}</Badge>}
        </div>
      )
    },
  },
  {
    id: 'customer',
    header: 'Cliente',
    cell: ({ row }) => row.original.customer?.name ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} deleted={!!row.original.deleted_at} />,
  },
  {
    id: 'technician',
    header: 'Técnico',
    cell: ({ row }) => row.original.technician?.name ?? '—',
  },
  {
    accessorKey: 'reception_date',
    header: 'Recepción',
    cell: ({ row }) => formatDate(row.getValue('reception_date')),
  },
  {
    accessorKey: 'estimated_return_date',
    header: 'Entrega Est.',
    cell: ({ row }) => {
      const date = row.getValue('estimated_return_date')
      const status = row.original.status
      const isOverdue = date && status !== 'delivered' && new Date(date) < new Date()
      return (
        <span className={cn(isOverdue && 'text-destructive font-medium')}>
          {formatDate(date)}
        </span>
      )
    },
  },
  {
    accessorKey: 'total_cost',
    header: 'Costo Total',
    cell: ({ row }) => formatCurrency(row.getValue('total_cost')),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <TicketActions ticket={row.original} />,
  },
]

export default function TicketsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showTrashed, setShowTrashed] = useState(false)

  const restoreMutation = useMutation({
    mutationFn: (id) => restoreTicket(id),
    onSuccess: () => { toast.success('Ticket restaurado'); qc.invalidateQueries({ queryKey: ['tickets'] }) },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al restaurar'),
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const handleStatusChange = useCallback((val) => {
    setStatusFilter(val)
    setPage(1)
  }, [])

  const params = {
    page,
    per_page: PAGE_SIZE,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(showTrashed && { with_trashed: 1 }),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', params],
    queryFn: () => getTickets(params).then((r) => r.data),
  })

  const tickets = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const lastPage = data?.meta?.last_page ?? 1
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: lastPage,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets de Soporte</h1>
          <p className="text-muted-foreground">Gestiona los tickets de reparación y mantenimiento</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => { setShowTrashed((v) => !v); setPage(1) }}>
              {showTrashed ? <EyeOff className="size-4 mr-1.5" /> : <Eye className="size-4 mr-1.5" />}
              {showTrashed ? 'Ocultar eliminados' : 'Ver eliminados'}
            </Button>
          )}
          <Button onClick={() => navigate('/tickets/new')}>
            <Plus data-icon="inline-start" />
            Nuevo Ticket
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(TICKET_STATUSES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12">
                  <Empty title="Sin tickets" description="No se encontraron tickets con los filtros aplicados" />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isDeleted = !!row.original.deleted_at
                return (
                  <TableRow key={row.id} className={cn(isDeleted && 'opacity-50')}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.column.id === 'actions' && isDeleted ? (
                          <Button variant="ghost" size="icon" className="size-7" title="Restaurar" onClick={() => restoreMutation.mutate(row.original.id)} disabled={restoreMutation.isPending}>
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total > 0 ? `Mostrando ${from}-${to} de ${total} resultados` : 'Sin resultados'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft data-icon="inline-start" />
            Anterior
          </Button>
          <span>Página {page} de {lastPage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page >= lastPage}
          >
            Siguiente
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}
