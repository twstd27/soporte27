import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory, restoreCategory } from '@/api/categories.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function CategoryDialog({ open, onClose, category }) {
  const qc = useQueryClient()
  const isEdit = !!category
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '')
      setDescription(category?.description ?? '')
      setNameError('')
    }
  }, [open, category?.id])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateCategory(category.id, data) : createCategory(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada')
      qc.invalidateQueries({ queryKey: ['categories'] })
      onClose()
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al guardar'),
  })

  const handleSubmit = () => {
    if (!name.trim()) { setNameError('El nombre es requerido'); return }
    setNameError('')
    mutation.mutate({ name: name.trim(), description: description.trim() || undefined })
  }

  const handleOpenChange = (v) => {
    if (!v) { setNameError(''); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Nombre *</FieldLabel>
            <Input
              placeholder="Nombre de la categoría"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Descripción</FieldLabel>
            <Textarea
              rows={3}
              placeholder="Descripción opcional..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showTrashed, setShowTrashed] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['categories', { with_trashed: showTrashed }],
    queryFn: () => getCategories(showTrashed ? { with_trashed: 1 } : undefined).then((r) => r.data.data ?? r.data),
  })
  const categories = Array.isArray(data) ? data : (data?.data ?? [])

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      toast.success('Categoría eliminada')
      qc.invalidateQueries({ queryKey: ['categories'] })
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'No se puede eliminar'),
  })

  const restoreMutation = useMutation({
    mutationFn: (id) => restoreCategory(id),
    onSuccess: () => { toast.success('Categoría restaurada'); qc.invalidateQueries({ queryKey: ['categories'] }) },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al restaurar'),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">Categorías de soporte técnico</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTrashed((v) => !v)}>
            {showTrashed ? <EyeOff className="size-4 mr-1.5" /> : <Eye className="size-4 mr-1.5" />}
            {showTrashed ? 'Ocultar eliminados' : 'Ver eliminados'}
          </Button>
          <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
            <Plus data-icon="inline-start" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {[1, 2, 3].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12">
                  <Empty title="Sin categorías" description="Crea la primera categoría de soporte" />
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => {
                const isDeleted = !!cat.deleted_at
                return (
                  <TableRow key={cat.id} className={cn(isDeleted && 'opacity-50')}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {cat.name}
                        {isDeleted && <Badge variant="destructive" className="text-xs">Eliminado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cat.description || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {isDeleted ? (
                          <Button variant="ghost" size="icon" title="Restaurar" onClick={() => restoreMutation.mutate(cat.id)} disabled={restoreMutation.isPending}>
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelected(cat); setDialogOpen(true) }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(cat)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
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

      <CategoryDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelected(null) }}
        category={selected}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong>. Podrás restaurarla desde "Ver eliminados".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate(deleteTarget?.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
