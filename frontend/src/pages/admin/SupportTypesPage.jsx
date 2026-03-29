import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { getSupportTypes, createSupportType, updateSupportType, deleteSupportType, restoreSupportType } from '@/api/support_types.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function SupportTypeDialog({ open, onClose, supportType }) {
  const qc = useQueryClient()
  const isEdit = !!supportType
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (open) {
      setName(supportType?.name ?? '')
      setDescription(supportType?.description ?? '')
      setNameError('')
    }
  }, [open, supportType?.id])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateSupportType(supportType.id, data) : createSupportType(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Tipo actualizado' : 'Tipo creado')
      qc.invalidateQueries({ queryKey: ['support-types'] })
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
          <DialogTitle>{isEdit ? 'Editar Tipo de Soporte' : 'Nuevo Tipo de Soporte'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Nombre *</FieldLabel>
            <Input placeholder="Ej. Reparación, Mantenimiento..." value={name} onChange={(e) => setName(e.target.value)} />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Descripción</FieldLabel>
            <Textarea rows={2} placeholder="Descripción opcional..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear tipo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SupportTypesPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showTrashed, setShowTrashed] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['support-types', { with_trashed: showTrashed }],
    queryFn: () => getSupportTypes(showTrashed ? { with_trashed: 1 } : undefined).then((r) => r.data.data ?? r.data),
  })
  const types = Array.isArray(data) ? data : (data?.data ?? [])

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSupportType(id),
    onSuccess: () => { toast.success('Tipo eliminado'); qc.invalidateQueries({ queryKey: ['support-types'] }); setDeleteTarget(null) },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'No se puede eliminar'),
  })

  const restoreMutation = useMutation({
    mutationFn: (id) => restoreSupportType(id),
    onSuccess: () => { toast.success('Tipo restaurado'); qc.invalidateQueries({ queryKey: ['support-types'] }) },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al restaurar'),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tipos de Soporte</h1>
          <p className="text-muted-foreground">Tipos de servicio técnico ofrecidos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTrashed((v) => !v)}>
            {showTrashed ? <EyeOff className="size-4 mr-1.5" /> : <Eye className="size-4 mr-1.5" />}
            {showTrashed ? 'Ocultar eliminados' : 'Ver eliminados'}
          </Button>
          <Button onClick={() => { setSelected(null); setDialogOpen(true) }}>
            <Plus data-icon="inline-start" />Nuevo Tipo
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
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>{[1,2,3].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : types.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-12"><Empty title="Sin tipos" description="Crea el primer tipo de soporte" /></TableCell></TableRow>
            ) : (
              types.map((t) => {
                const isDeleted = !!t.deleted_at
                return (
                  <TableRow key={t.id} className={cn(isDeleted && 'opacity-50')}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {t.name}
                        {isDeleted && <Badge variant="destructive" className="text-xs">Eliminado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.description || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {isDeleted ? (
                          <Button variant="ghost" size="icon" title="Restaurar" onClick={() => restoreMutation.mutate(t.id)} disabled={restoreMutation.isPending}>
                            <RotateCcw className="size-4" />
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => { setSelected(t); setDialogOpen(true) }}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(t)}><Trash2 className="size-4" /></Button>
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

      <SupportTypeDialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelected(null) }} supportType={selected} />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de soporte?</AlertDialogTitle>
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
