import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, X, Save, Eye, Trash2, Upload, Package,
  ChevronDown, ChevronRight, Wrench, Camera, User,
  FileText, Boxes, Receipt, Info, History, DollarSign, Pencil,
} from 'lucide-react'
import { getTicket, updateTicket, updateTicketStatus, uploadPhoto, deletePhoto } from '@/api/tickets.api'
import { createPart, deletePart } from '@/api/parts.api'
import { getSuppliers } from '@/api/suppliers.api'
import { SupplierDialog } from '@/components/suppliers/SupplierDialog'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { TICKET_STATUSES } from '@/utils/constants'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext,
} from '@/components/ui/carousel'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const STATUS_TRANSITIONS = {
  received:      ['diagnosing'],
  diagnosing:    ['in_repair', 'waiting_parts', 'ready'],
  in_repair:     ['waiting_parts', 'ready'],
  waiting_parts: ['in_repair', 'ready'],
  ready:         ['delivered'],
  delivered:     [],
}

const today = new Date().toISOString().split('T')[0]

function StatusBadge({ status }) {
  const info = TICKET_STATUSES[status]
  if (!info) return <Badge variant="secondary">{status}</Badge>
  return <Badge variant={info.variant}>{info.label}</Badge>
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const sparePartsRef = useRef(null)

  const [viewPhoto, setViewPhoto]                   = useState(null)
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [actualReturnDate, setActualReturnDate]     = useState(today)
  const [reportDialogOpen, setReportDialogOpen]     = useState(false)
  const [diagnosis, setDiagnosis]                   = useState('')
  const [workPerformed, setWorkPerformed]           = useState('')
  const [laborCost, setLaborCost]                   = useState('')
  const [partDialogOpen, setPartDialogOpen]         = useState(false)
  const [partForm, setPartForm]                     = useState({ name: '', supplier_id: '', unit_price: '', quantity: '1', purchase_date: today })
  const [deletePhotoId, setDeletePhotoId]           = useState(null)
  const [uploadingPhoto, setUploadingPhoto]         = useState(false)
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id).then((r) => r.data.data ?? r.data),
    // change_logs and status_logs are included in the detail resource
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers().then((r) => r.data.data ?? r.data),
  })
  const supplierList = Array.isArray(suppliersData) ? suppliersData : (suppliersData?.data ?? [])

  useEffect(() => {
    if (ticket) {
      setDiagnosis(ticket.diagnosis ?? '')
      setWorkPerformed(ticket.work_performed ?? '')
      setLaborCost(String(ticket.labor_cost ?? ''))
    }
  }, [ticket?.id, ticket?.diagnosis, ticket?.work_performed, ticket?.labor_cost])

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['ticket', id] })
    qc.invalidateQueries({ queryKey: ['tickets'] })
  }

  const updateMutation = useMutation({
    mutationFn: (data) => updateTicket(id, data),
    onSuccess: () => { toast.success('Guardado correctamente'); invalidate() },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al guardar'),
  })

  const statusMutation = useMutation({
    mutationFn: (data) => updateTicketStatus(id, data),
    onSuccess: () => { toast.success('Estado actualizado'); invalidate() },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al cambiar estado'),
  })

  const addPartMutation = useMutation({
    mutationFn: (data) => createPart(id, data),
    onSuccess: () => {
      toast.success('Repuesto agregado')
      setPartDialogOpen(false)
      setPartForm({ name: '', supplier_id: '', unit_price: '', quantity: '1', purchase_date: today })
      invalidate()
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al agregar repuesto'),
  })

  const deletePartMutation = useMutation({
    mutationFn: (partId) => deletePart(id, partId),
    onSuccess: () => { toast.success('Repuesto eliminado'); invalidate() },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al eliminar'),
  })

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId) => deletePhoto(id, photoId),
    onSuccess: () => { toast.success('Foto eliminada'); setDeletePhotoId(null); invalidate() },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al eliminar foto'),
  })


  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) return <div className="text-muted-foreground">Ticket no encontrado</div>

  const canEdit            = user?.role === 'admin' || (ticket.status !== 'delivered' && ticket.technician_id === user?.id)
  const parts              = ticket.spare_parts ?? []
  const photos             = ticket.photos ?? []
  const statusLogs         = ticket.status_logs ?? []
  const changeLogs         = ticket.change_logs ?? []

  const FIELD_LABELS = { diagnosis: 'Diagnóstico', work_performed: 'Trabajo realizado', labor_cost: 'Mano de obra', technician_id: 'Técnico' }

  // Merge status logs + field change logs into a single activity feed, newest first
  const activityFeed = [
    ...statusLogs.map((l) => ({ ...l, _type: 'status', _date: l.created_at })),
    ...changeLogs.map((l) => ({ ...l, _type: 'change', _date: l.created_at })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date))
  const partsTotal         = parts.reduce((sum, p) => sum + parseFloat(p.subtotal ?? 0), 0)
  const total              = parseFloat(ticket.total_cost ?? 0)
  const allowedTransitions = STATUS_TRANSITIONS[ticket.status] ?? []

  const changeStatus = (status) => {
    if (status === 'delivered') { setDeliveryDialogOpen(true); return }
    statusMutation.mutate({ status })
  }

  const confirmDelivery = () => {
    statusMutation.mutate({ status: 'delivered', actual_return_date: actualReturnDate })
    setDeliveryDialogOpen(false)
  }

  const handleSaveReport = () => {
    updateMutation.mutate(
      { diagnosis, work_performed: workPerformed },
      { onSuccess: () => setReportDialogOpen(false) },
    )
  }

  const handleAddPart = () => {
    addPartMutation.mutate({
      name:          partForm.name,
      supplier_id:   partForm.supplier_id ? parseInt(partForm.supplier_id) : undefined,
      unit_price:    parseFloat(partForm.unit_price),
      quantity:      parseInt(partForm.quantity),
      purchase_date: partForm.purchase_date || undefined,
    })
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photos.length >= 3) { toast.error('Máximo 3 fotos'); return }
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      await uploadPhoto(id, fd)
      toast.success('Foto agregada')
      invalidate()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al subir foto')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const scrollToSpares = () =>
    sparePartsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="flex flex-col gap-4">

      {/* ── TITLE ROW + STATUS DROPDOWN ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{ticket.ticket_number}</h1>
          <StatusBadge status={ticket.status} />
        </div>

        {canEdit && allowedTransitions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={statusMutation.isPending}>
                {statusMutation.isPending ? 'Cambiando...' : 'Cambiar estado'}
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Siguiente estado
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allowedTransitions.map((s) => (
                <DropdownMenuItem key={s} onClick={() => changeStatus(s)}>
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                  {TICKET_STATUSES[s]?.label ?? s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {ticket.status === 'delivered' && user?.role !== 'admin' && (
        <div className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" />
          Este ticket ha sido entregado y no puede modificarse.
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Row 1: [Tool info + Customer stacked] | [Photos tall] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">

            {/* Left stack: Tool info above Customer */}
            <div className="flex flex-col gap-4">
              {/* Tool info */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="size-4 text-muted-foreground" />
                    Información de la herramienta
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm pt-0">
                  <div>
                    <span className="text-muted-foreground">Marca</span>
                    <p className="font-medium">{ticket.brand?.name ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modelo</span>
                    <p className="font-medium">{ticket.model}</p>
                  </div>
                  {ticket.serial_number && (
                    <div>
                      <span className="text-muted-foreground">Serie</span>
                      <p className="font-medium">{ticket.serial_number}</p>
                    </div>
                  )}
                  {ticket.description && (
                    <div>
                      <span className="text-muted-foreground">Descripción</span>
                      <p className="font-medium">{ticket.description}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Tipo soporte</span>
                    <p className="font-medium">{ticket.support_type?.name ?? '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Problema reportado</span>
                    <p className="mt-1">{ticket.problem_description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm pt-0">
                  <div className="font-medium text-base">{ticket.customer?.name ?? '—'}</div>
                  {ticket.customer?.company && (
                    <div className="text-muted-foreground">{ticket.customer.company}</div>
                  )}
                  <div className="flex flex-col gap-1.5 mt-1">
                    {ticket.customer?.phone && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Teléfono</span>
                        <span>{ticket.customer.phone}</span>
                      </div>
                    )}
                    {ticket.customer?.email && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Correo</span>
                        <span className="truncate">{ticket.customer.email}</span>
                      </div>
                    )}
                    {ticket.customer?.document_number && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Documento</span>
                        <span>{ticket.customer.document_number}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Photos — full height of the left stack */}
            <Card className="flex flex-col">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Camera className="size-4 text-muted-foreground" />
                    Fotos
                  </span>
                  {canEdit && photos.length < 3 && (
                    <label>
                      <Button variant="outline" size="sm" asChild>
                        <span className="cursor-pointer">
                          <Upload data-icon="inline-start" />
                          {uploadingPhoto ? 'Subiendo...' : 'Agregar'}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pt-0">
                {photos.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted text-muted-foreground text-sm gap-2 min-h-[160px]">
                    <Camera className="size-8 opacity-25" />
                    Sin fotos adjuntas
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center relative px-8">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {photos.map((photo) => (
                          <CarouselItem key={photo.id}>
                            <div className="relative rounded-md overflow-hidden aspect-square bg-muted group cursor-pointer">
                              <img
                                src={photo.url}
                                alt="Foto equipo"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="icon" variant="secondary" className="size-8" onClick={() => setViewPhoto(photo.url)}>
                                  <Eye className="size-4" />
                                </Button>
                                {canEdit && (
                                  <Button size="icon" variant="destructive" className="size-8" onClick={() => setDeletePhotoId(photo.id)}>
                                    <Trash2 className="size-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {photos.length > 1 && (
                        <>
                          <CarouselPrevious className="-left-6" />
                          <CarouselNext className="-right-6" />
                        </>
                      )}
                    </Carousel>
                    <p className="text-xs text-center text-muted-foreground mt-3">{photos.length} / 3 fotos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Support details + Informe técnico (merged) */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="size-4 text-muted-foreground" />
                Detalles del soporte
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 flex flex-col gap-0">
              {/* Support detail rows */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm pb-4">
                <div>
                  <span className="text-muted-foreground">Técnico</span>
                  <p className="font-medium">{ticket.technician?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Categoría</span>
                  <p className="font-medium">{ticket.category?.name ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Recepción</span>
                  <p className="font-medium">{formatDate(ticket.reception_date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Entrega estimada</span>
                  <p className="font-medium">{formatDate(ticket.estimated_return_date)}</p>
                </div>
                {ticket.actual_return_date && (
                  <div>
                    <span className="text-muted-foreground">Entrega real</span>
                    <p className="font-medium">{formatDate(ticket.actual_return_date)}</p>
                  </div>
                )}
                {ticket.warranty_days && (
                  <div>
                    <span className="text-muted-foreground">Garantía</span>
                    <p className="font-medium">{ticket.warranty_days} días</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Informe técnico sub-section */}
              <div className="py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="size-4 text-muted-foreground" />
                    Informe técnico
                  </span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setReportDialogOpen(true)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Diagnóstico</span>
                    <p className="mt-1 text-sm leading-relaxed">
                      {ticket.diagnosis || <span className="italic text-muted-foreground">Sin diagnóstico</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trabajo realizado</span>
                    <p className="mt-1 text-sm leading-relaxed">
                      {ticket.work_performed || <span className="italic text-muted-foreground">Sin registro</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notas internas */}
              {ticket.internal_notes && (
                <>
                  <Separator />
                  <div className="pt-3 text-sm">
                    <span className="text-muted-foreground">Notas internas</span>
                    <p className="mt-1 text-xs bg-muted/40 rounded p-2 leading-relaxed">{ticket.internal_notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Spare parts */}
          <Card ref={sparePartsRef}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Boxes className="size-4 text-muted-foreground" />
                  Repuestos utilizados
                </span>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={() => setPartDialogOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Agregar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {parts.length === 0 ? (
                <p className="text-sm text-muted-foreground px-4 pb-4">Sin repuestos registrados</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">P. Unit.</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      {canEdit && <TableHead />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">{part.name}</TableCell>
                        <TableCell>{part.supplier?.name ?? '—'}</TableCell>
                        <TableCell>{formatDate(part.purchase_date)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(part.unit_price)}</TableCell>
                        <TableCell className="text-right">{part.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(parseFloat(part.subtotal ?? 0))}</TableCell>
                        {canEdit && (
                          <TableCell>
                            <Button variant="ghost" size="icon" className="size-7 text-destructive"
                              onClick={() => deletePartMutation.mutate(part.id)}>
                              <X className="size-3" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="flex flex-col gap-4">

          {/* Cost summary */}
          <Card className="border-primary/40">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="size-4 text-muted-foreground" />
                Resumen de costos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-0 pt-0 pb-0">
              <div className="flex items-center justify-between px-1 py-2.5 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="size-3.5" />
                  Mano de obra
                </span>
                {canEdit ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      className="w-28 h-7 text-right text-sm"
                      value={laborCost}
                      onChange={(e) => setLaborCost(e.target.value)}
                      placeholder="0"
                    />
                    <Button size="icon" variant="ghost" className="size-7 shrink-0"
                      onClick={() => updateMutation.mutate({ labor_cost: parseFloat(laborCost) || 0 })}
                      disabled={updateMutation.isPending}>
                      <Save className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="font-medium">{formatCurrency(ticket.labor_cost)}</span>
                )}
              </div>

              <button
                type="button"
                onClick={scrollToSpares}
                className="flex items-center justify-between px-1 py-2.5 border-b w-full text-left hover:bg-muted/50 transition-colors rounded-sm group"
              >
                <span className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors">
                  <Package className="size-3.5" />
                  Repuestos
                  <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="font-medium">{formatCurrency(partsTotal)}</span>
              </button>

              {ticket.advance_payment > 0 && (
                <div className="flex items-center justify-between px-1 py-2.5 border-b">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="size-3.5" />
                    Adelanto
                  </span>
                  <span className="font-medium text-green-600">- {formatCurrency(ticket.advance_payment)}</span>
                </div>
              )}

              <div className="flex items-center justify-between px-1 py-4">
                <span className="font-bold text-base">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Activity feed */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="size-4 text-muted-foreground" />
                Actividad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activityFeed.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {activityFeed.map((entry, i) => (
                    <div key={entry.id ?? i} className="flex flex-col gap-0.5 text-sm border-l-2 border-muted pl-3">
                      {entry._type === 'status' ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.old_status && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {TICKET_STATUSES[entry.old_status]?.label ?? entry.old_status}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                            </>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {TICKET_STATUSES[entry.new_status]?.label ?? entry.new_status}
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-xs">
                          <span className="font-medium">{FIELD_LABELS[entry.field] ?? entry.field}</span>
                          {entry.field !== 'technician_id' && entry.old_value && (
                            <span className="text-muted-foreground"> actualizado</span>
                          )}
                          {entry.field === 'labor_cost' && (
                            <span className="text-muted-foreground">
                              {' '}— {entry.old_value} → {entry.new_value}
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {entry.changed_by?.name ?? entry.user?.name ?? 'Sistema'} · {formatDate(entry._date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── DIALOGS ── */}

      {/* Informe técnico modal */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Informe técnico
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Diagnóstico</FieldLabel>
              <Textarea
                rows={4}
                placeholder="Diagnóstico técnico..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Trabajo realizado</FieldLabel>
              <Textarea
                rows={4}
                placeholder="Descripción del trabajo realizado..."
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveReport} disabled={updateMutation.isPending}>
              <Save data-icon="inline-start" />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar informe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery date */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar entrega</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel>Fecha de entrega real</FieldLabel>
            <Input type="date" value={actualReturnDate} onChange={(e) => setActualReturnDate(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmDelivery} disabled={statusMutation.isPending}>Confirmar entrega</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add spare part */}
      <Dialog
        open={partDialogOpen}
        onOpenChange={(v) => {
          setPartDialogOpen(v)
          if (!v) setPartForm({ name: '', supplier_id: '', unit_price: '', quantity: '1', purchase_date: today })
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-4" />
              Agregar Repuesto
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Nombre *</FieldLabel>
              <Input placeholder="Nombre del repuesto" value={partForm.name}
                onChange={(e) => setPartForm((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field>
              <FieldLabel>Proveedor</FieldLabel>
              <div className="flex gap-2">
                <Select value={partForm.supplier_id} onValueChange={(v) => setPartForm((p) => ({ ...p, supplier_id: v }))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar proveedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {supplierList.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setSupplierDialogOpen(true)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Precio unitario *</FieldLabel>
                <Input type="number" min="0" placeholder="0" value={partForm.unit_price}
                  onChange={(e) => setPartForm((p) => ({ ...p, unit_price: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel>Cantidad</FieldLabel>
                <Input type="number" min="1" value={partForm.quantity}
                  onChange={(e) => setPartForm((p) => ({ ...p, quantity: e.target.value }))} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Fecha de compra</FieldLabel>
              <Input type="date" value={partForm.purchase_date}
                onChange={(e) => setPartForm((p) => ({ ...p, purchase_date: e.target.value }))} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddPart} disabled={!partForm.name || !partForm.unit_price || addPartMutation.isPending}>
              {addPartMutation.isPending ? 'Guardando...' : 'Guardar repuesto'}
            </Button>
          </DialogFooter>

          {/* SupplierDialog nested here to avoid aria-hidden conflict */}
          <SupplierDialog
            open={supplierDialogOpen}
            onClose={() => setSupplierDialogOpen(false)}
            onSuccess={(supplier) => setPartForm((p) => ({ ...p, supplier_id: String(supplier.id) }))}
          />
        </DialogContent>
      </Dialog>

      {/* Photo viewer — 80vw wide, image 70vh tall */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="w-[80vw] max-w-[80vw]">
          <DialogHeader>
            <DialogTitle>Foto del equipo</DialogTitle>
          </DialogHeader>
          {viewPhoto && (
            <img
              src={viewPhoto}
              alt="Foto completa"
              className="w-full h-[70vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete photo confirmation */}
      <AlertDialog open={!!deletePhotoId} onOpenChange={() => setDeletePhotoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePhotoMutation.mutate(deletePhotoId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
