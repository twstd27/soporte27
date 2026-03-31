import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RotateCcw, Eye, EyeOff, Truck } from 'lucide-react'
import { getSuppliers, deleteSupplier, restoreSupplier } from '@/api/suppliers.api'
import { SupplierDialog } from '@/components/suppliers/SupplierDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function SuppliersPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showTrashed, setShowTrashed] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', { with_trashed: showTrashed }],
    queryFn: () => getSuppliers(showTrashed ? { with_trashed: 1 } : undefined).then((r) => r.data.data ?? r.data),
  })
  const suppliers = Array.isArray(data) ? data : (data?.data ?? [])

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSupplier(id),
    onSuccess: () => { toast.success('Proveedor eliminado'); qc.invalidateQueries({ queryKey: ['suppliers'] }); setDeleteTarget(null) },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al eliminar'),
  })

  const restoreMutation = useMutation({
    mutationFn: (id) => restoreSupplier(id),
    onSuccess: () => { toast.success('Proveedor restaurado'); qc.invalidateQueries({ queryKey: ['suppliers'] }) },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al restaurar'),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Proveedores de repuestos y materiales</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTrashed((v) => !v)}>
            {showTrashed ? <EyeOff className="size-4 mr-1.5" /> : <Eye className="size-4 mr-1.5" />}
            {showTrashed ? 'Ocultar eliminados' : 'Ver eliminados'}
          </Button>
          <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
            <Plus data-icon="inline-start" />Nuevo Proveedor
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>{[1,2,3,4,5].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : suppliers.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12"><Empty icon={Truck} title="Sin proveedores registrados" description="0 registros · Crea el primer proveedor" /></TableCell></TableRow>
            ) : (
              suppliers.map((s) => {
                const isDeleted = !!s.deleted_at
                return (
                  <TableRow key={s.id} className={cn(isDeleted && 'opacity-50')}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {s.name}
                        {isDeleted && <Badge variant="destructive" className="text-xs">Eliminado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{s.contact_name || '—'}</TableCell>
                    <TableCell>{s.phone || '—'}</TableCell>
                    <TableCell>{s.email || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {isDeleted ? (
                          <Button variant="ghost" size="icon" title="Restaurar" onClick={() => restoreMutation.mutate(s.id)} disabled={restoreMutation.isPending}>
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => { setSelected(s); setDialogOpen(true) }}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(s)}><Trash2 className="size-4" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SupplierDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelected(null) }} supplier={selected} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará <strong>{deleteTarget?.name}</strong>. Podrás restaurarlo desde "Ver eliminados".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(deleteTarget?.id)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
