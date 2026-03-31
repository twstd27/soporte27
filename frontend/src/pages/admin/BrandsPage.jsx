import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RotateCcw, Eye, EyeOff, Bookmark } from 'lucide-react'
import { getBrands, createBrand, updateBrand, deleteBrand, restoreBrand } from '@/api/brands.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function BrandDialog({ open, onClose, brand }) {
  const qc = useQueryClient()
  const isEdit = !!brand
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (open) {
      setName(brand?.name ?? '')
      setNameError('')
    }
  }, [open, brand?.id])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateBrand(brand.id, data) : createBrand(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Marca actualizada' : 'Marca creada')
      qc.invalidateQueries({ queryKey: ['brands'] })
      onClose()
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al guardar'),
  })

  const handleSubmit = () => {
    if (!name.trim()) { setNameError('El nombre es requerido'); return }
    setNameError('')
    mutation.mutate({ name: name.trim() })
  }

  const handleOpenChange = (v) => {
    if (!v) { setName(brand?.name ?? ''); setNameError(''); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Marca' : 'Nueva Marca'}</DialogTitle>
        </DialogHeader>
        <Field>
          <FieldLabel>Nombre *</FieldLabel>
          <Input placeholder="Ej. Bosch, Dewalt..." maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          {nameError && <FieldError>{nameError}</FieldError>}
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear marca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BrandsPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showTrashed, setShowTrashed] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['brands', { with_trashed: showTrashed }],
    queryFn: () => getBrands(showTrashed ? { with_trashed: 1 } : undefined).then((r) => r.data.data ?? r.data),
  })
  const brands = Array.isArray(data) ? data : (data?.data ?? [])

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBrand(id),
    onSuccess: () => { toast.success('Marca eliminada'); qc.invalidateQueries({ queryKey: ['brands'] }); setDeleteTarget(null) },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'No se puede eliminar'),
  })

  const restoreMutation = useMutation({
    mutationFn: (id) => restoreBrand(id),
    onSuccess: () => { toast.success('Marca restaurada'); qc.invalidateQueries({ queryKey: ['brands'] }) },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al restaurar'),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marcas</h1>
          <p className="text-muted-foreground">Marcas de herramientas registradas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTrashed((v) => !v)}>
            {showTrashed ? <EyeOff className="size-4 mr-1.5" /> : <Eye className="size-4 mr-1.5" />}
            {showTrashed ? 'Ocultar eliminados' : 'Ver eliminados'}
          </Button>
          <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
            <Plus data-icon="inline-start" />Nueva Marca
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>{[1,2].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : brands.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="py-12"><Empty icon={Bookmark} title="Sin marcas registradas" description="0 registros · Crea la primera marca" /></TableCell></TableRow>
            ) : (
              brands.map((b) => {
                const isDeleted = !!b.deleted_at
                return (
                  <TableRow key={b.id} className={cn(isDeleted && 'opacity-50')}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {b.name}
                        {isDeleted && <Badge variant="destructive" className="text-xs">Eliminado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {isDeleted ? (
                          <Button variant="ghost" size="icon" title="Restaurar" onClick={() => restoreMutation.mutate(b.id)} disabled={restoreMutation.isPending}>
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => { setSelected(b); setDialogOpen(true) }}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(b)}><Trash2 className="size-4" /></Button>
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

      <BrandDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelected(null) }} brand={selected} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar marca?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará <strong>{deleteTarget?.name}</strong>. Podrás restaurarla desde "Ver eliminados".</AlertDialogDescription>
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
