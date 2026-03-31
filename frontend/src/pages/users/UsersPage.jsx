import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Power, Eye, EyeOff, UserCog } from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { getUsers, createUser, updateUser, toggleUserActive } from '@/api/users.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const createSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  role: z.enum(['admin', 'technician']),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const editSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  role: z.enum(['admin', 'technician']),
  phone: z.string().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
})

function UserDialog({ open, onClose, user }) {
  const qc = useQueryClient()
  const isEdit = !!user
  const schema = isEdit ? editSchema : createSchema

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', role: 'technician', phone: '', password: '' },
  })

  useEffect(() => {
    if (open) {
      reset(user
        ? { name: user.name, email: user.email, role: user.role, phone: user.phone ?? '', password: '' }
        : { name: '', email: '', role: 'technician', phone: '', password: '' }
      )
    }
  }, [open, user?.id])

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data }
      if (isEdit && !payload.password) delete payload.password
      return isEdit ? updateUser(user.id, payload) : createUser(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Usuario actualizado' : 'Usuario creado')
      qc.invalidateQueries({ queryKey: ['users'] })
      reset()
      onClose()
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al guardar'),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Nombre *</FieldLabel>
            <Input placeholder="Nombre completo" {...register('name')} />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Correo *</FieldLabel>
            <Input type="email" placeholder="correo@empresa.com" {...register('email')} />
            {errors.email && <FieldError>{errors.email.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Rol *</FieldLabel>
            <Select value={watch('role')} onValueChange={(v) => setValue('role', v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="technician">Técnico</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.role && <FieldError>{errors.role.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>Teléfono</FieldLabel>
            <Input placeholder="Teléfono" {...register('phone')} />
          </Field>
          <Field>
            <FieldLabel>{isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</FieldLabel>
            <Input type="password" placeholder="••••••••" {...register('password')} />
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [toggleUser, setToggleUser] = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['users', { showInactive }],
    queryFn: () => getUsers(showInactive ? {} : { is_active: true }).then((r) => r.data.data ?? r.data),
  })

  const users = Array.isArray(data) ? data : (data?.data ?? [])

  const toggleMutation = useMutation({
    mutationFn: (id) => toggleUserActive(id),
    onSuccess: () => {
      toast.success('Estado del usuario actualizado')
      qc.invalidateQueries({ queryKey: ['users'] })
      setToggleUser(null)
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al cambiar estado'),
  })

  const columns = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
    },
    { accessorKey: 'email', header: 'Correo' },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => (
        <Badge variant={row.getValue('role') === 'admin' ? 'default' : 'secondary'}>
          {row.getValue('role') === 'admin' ? 'Admin' : 'Técnico'}
        </Badge>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => row.getValue('phone') || '—',
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.getValue('is_active') ? 'success' : 'outline'}>
          {row.getValue('is_active') ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setSelectedUser(row.original); setDialogOpen(true) }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setToggleUser(row.original)}
            className={row.original.is_active ? 'text-destructive hover:text-destructive' : 'text-muted-foreground'}
          >
            <Power className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowInactive((v) => !v)}>
            {showInactive ? <EyeOff className="size-4 mr-1.5" /> : <Eye className="size-4 mr-1.5" />}
            {showInactive ? 'Ocultar inactivos' : 'Ver inactivos'}
          </Button>
          <Button onClick={() => { setSelectedUser(null); setDialogOpen(true) }}>
            <Plus data-icon="inline-start" />
            Nuevo Usuario
          </Button>
        </div>
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
                  {columns.map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12">
                  <Empty icon={UserCog} title="Sin usuarios registrados" description="0 registros · Crea el primer usuario" />
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

      <UserDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedUser(null) }}
        user={selectedUser}
      />

      <AlertDialog open={!!toggleUser} onOpenChange={() => setToggleUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleUser?.is_active ? 'Desactivar usuario' : 'Activar usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleUser?.is_active
                ? `¿Desactivar a ${toggleUser?.name}? No podrá iniciar sesión.`
                : `¿Activar a ${toggleUser?.name}? Podrá iniciar sesión nuevamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleMutation.mutate(toggleUser?.id)}
              className={toggleUser?.is_active ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {toggleUser?.is_active ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
