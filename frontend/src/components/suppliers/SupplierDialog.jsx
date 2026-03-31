import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createSupplier, updateSupplier } from '@/api/suppliers.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export function SupplierDialog({ open, onClose, supplier, onSuccess }) {
  const qc = useQueryClient()
  const isEdit = !!supplier
  const [form, setForm] = useState({ name: '', contact_name: '', phone: '', email: '' })
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        name: supplier?.name ?? '',
        contact_name: supplier?.contact_name ?? '',
        phone: supplier?.phone ?? '',
        email: supplier?.email ?? '',
      })
      setNameError('')
    }
  }, [open, supplier?.id])

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateSupplier(supplier.id, data) : createSupplier(data),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Proveedor actualizado' : 'Proveedor creado')
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      onSuccess?.(res.data.data ?? res.data)
      onClose()
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al guardar'),
  })

  const handleSubmit = () => {
    if (!form.name.trim()) { setNameError('El nombre es requerido'); return }
    setNameError('')
    mutation.mutate({
      name: form.name.trim(),
      contact_name: form.contact_name || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
    })
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleOpenChange = (v) => {
    if (!v) { setNameError(''); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Nombre *</FieldLabel>
            <Input placeholder="Nombre del proveedor" maxLength={255} value={form.name} onChange={set('name')} />
            {nameError && <FieldError>{nameError}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Contacto</FieldLabel>
            <Input placeholder="Nombre del contacto" maxLength={255} value={form.contact_name} onChange={set('contact_name')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input placeholder="Teléfono" maxLength={12} value={form.phone} onChange={set('phone')} />
            </Field>
            <Field>
              <FieldLabel>Correo</FieldLabel>
              <Input type="email" placeholder="correo@proveedor.com" maxLength={255} value={form.email} onChange={set('email')} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear proveedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
