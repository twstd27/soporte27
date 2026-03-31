import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Pencil, Users } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { getCustomers } from '@/api/customers.api'
import { CustomerDialog } from '@/components/customers/CustomerDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers().then((r) => r.data.data ?? r.data),
  })

  const allCustomers = Array.isArray(data) ? data : (data?.data ?? [])

  const filtered = useMemo(() => {
    if (!search) return allCustomers
    const q = search.toLowerCase()
    return allCustomers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
    )
  }, [allCustomers, search])

  const columns = [
    { accessorKey: 'name', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
    { accessorKey: 'company', header: 'Empresa', cell: ({ row }) => row.getValue('company') || '—' },
    { accessorKey: 'phone', header: 'Teléfono' },
    { accessorKey: 'email', header: 'Correo', cell: ({ row }) => row.getValue('email') || '—' },
    { accessorKey: 'document_number', header: 'Documento', cell: ({ row }) => row.getValue('document_number') || '—' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setSelectedCustomer(row.original); setDialogOpen(true) }}
        >
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gestiona la base de clientes</p>
        </div>
        <Button onClick={() => { setSelectedCustomer(null); setDialogOpen(true) }}>
          <Plus data-icon="inline-start" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12">
                  <Empty icon={Users} title="Sin clientes registrados" description="0 registros · Agrega el primer cliente" />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedCustomer(null) }}
        customer={selectedCustomer}
      />
    </div>
  )
}
