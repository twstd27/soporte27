import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createCustomer, updateCustomer } from '@/api/customers.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  company: z.string().optional(),
  phone: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  document_number: z.string().optional(),
})

/**
 * CustomerDialog — Crear o editar un cliente.
 *
 * Props:
 *   open        — boolean
 *   onClose     — () => void
 *   customer    — objeto cliente para editar (null/undefined = crear)
 *   onSuccess   — (customer) => void   opcional: recibe el cliente creado/actualizado
 */
export function CustomerDialog({ open, onClose, customer, onSuccess }) {
  const qc = useQueryClient()
  const isEdit = !!customer

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', company: '', phone: '', email: '', document_number: '' },
  })

  // Sync form values when customer changes (edit mode)
  useEffect(() => {
    if (open) {
      reset(customer ?? { name: '', company: '', phone: '', email: '', document_number: '' })
    }
  }, [open, customer, reset])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit ? updateCustomer(customer.id, data) : createCustomer(data),
    onSuccess: (res) => {
      const saved = res.data.data ?? res.data
      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado')
      qc.invalidateQueries({ queryKey: ['customers'] })
      onSuccess?.(saved)
      onClose()
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message ?? 'Error al guardar'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-col gap-4"
        >
          <Field>
            <FieldLabel>Nombre *</FieldLabel>
            <Input placeholder="Nombre completo" {...register('name')} />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Empresa</FieldLabel>
            <Input placeholder="Empresa (opcional)" {...register('company')} />
          </Field>

          <Field>
            <FieldLabel>Teléfono *</FieldLabel>
            <Input placeholder="+57 300 000 0000" {...register('phone')} />
            {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Correo</FieldLabel>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              {...register('email')}
            />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Documento</FieldLabel>
            <Input
              placeholder="Número de documento"
              {...register('document_number')}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Guardando...'
                : isEdit
                ? 'Guardar cambios'
                : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
