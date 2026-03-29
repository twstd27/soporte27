import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Check,
  UserPlus,
  Plus,
} from "lucide-react";
import { getCustomers } from "@/api/customers.api";
import { getCategories } from "@/api/categories.api";
import { getBrands, createBrand } from "@/api/brands.api";
import { getSupportTypes } from "@/api/support_types.api";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { getUsers } from "@/api/users.api";
import { createTicket, uploadPhoto } from "@/api/tickets.api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const today = new Date().toISOString().split("T")[0];

const step1Schema = z.object({
  brand_id: z.preprocess((v) => v ?? '', z.string().min(1, 'Seleccione una marca')),
  model: z.string().min(1, "Ingrese el modelo del equipo"),
  serial_number: z.string().optional(),
  description: z.string().min(1, "Ingrese la descripción del equipo"),
  problem_description: z.string().min(1, "Describa el problema del equipo"),
});

const step2Schema = z.object({
  support_type_id: z.preprocess((v) => v ?? '', z.string().min(1, 'Seleccione un tipo de soporte')),
  category_id: z.preprocess((v) => v ?? '', z.string().min(1, 'Seleccione una categoría')),
  reception_date: z.string({ required_error: 'Seleccione la fecha de recepción' }).min(1, 'Seleccione la fecha de recepción'),
  estimated_return_date: z.string().optional(),
  technician_id: z.string().optional(),
  warranty_days: z.string().optional(),
  advance_payment: z.string().optional(),
  internal_notes: z.string().optional(),
});

function StepIndicator({ currentStep }) {
  const steps = ["Herramienta y Cliente", "Datos del Soporte", "Fotos"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-medium border-2 transition-colors",
                isActive && "border-primary bg-primary text-primary-foreground",
                isDone && "border-primary bg-primary text-primary-foreground",
                !isActive &&
                  !isDone &&
                  "border-muted-foreground/30 text-muted-foreground",
              )}
            >
              {isDone ? <Check className="size-4" /> : step}
            </div>
            <span
              className={cn(
                "text-sm hidden sm:inline",
                isActive ? "font-medium" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 mx-1",
                  isDone ? "bg-primary" : "bg-muted-foreground/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CustomerSearch({ onSelect, selected }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["customers-search", searchTerm],
    queryFn: () =>
      getCustomers({ search: searchTerm }).then((r) => r.data.data ?? r.data),
    enabled: searchTerm.length >= 2,
  });

  const customers = Array.isArray(data) ? data : (data?.data ?? []);

  const handleSelectCustomer = (customer) => {
    onSelect({ type: "existing", customer });
    setShowResults(false);
    setSearchTerm(customer.name);
  };

  // Called by CustomerDialog when a new customer is created
  const handleNewCustomerCreated = (customer) => {
    onSelect({ type: "existing", customer });
    setSearchTerm(customer.name);
    setNewCustomerOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel>Cliente *</FieldLabel>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 -mr-1"
                onClick={() => setNewCustomerOpen(true)}
              >
                <UserPlus className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Crear nuevo cliente</TooltipContent>
          </Tooltip>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nombre..."
            value={
              selected?.type === "existing"
                ? selected.customer.name
                : searchTerm
            }
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
              if (selected) onSelect(null);
            }}
            onFocus={() => setShowResults(true)}
            className="pl-9"
          />
        </div>
        {showResults && searchTerm.length >= 2 && (
          <div className="rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground">
                Buscando...
              </div>
            ) : customers.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No se encontraron clientes
              </div>
            ) : (
              customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={() => handleSelectCustomer(c)}
                >
                  <div className="font-medium">{c.name}</div>
                  {c.company && (
                    <div className="text-muted-foreground text-xs">
                      {c.company}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </Field>

      {selected?.type === "existing" && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm flex items-center justify-between">
          <div>
            <div className="font-medium">{selected.customer.name}</div>
            <div className="text-muted-foreground">
              {[selected.customer.phone, selected.customer.company]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onSelect(null);
              setSearchTerm("");
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      <CustomerDialog
        open={newCustomerOpen}
        onClose={() => setNewCustomerOpen(false)}
        onSuccess={handleNewCustomerCreated}
      />
    </div>
  );
}

export default function NewTicketPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerError, setCustomerError] = useState("");
  const [step1Data, setStep1Data] = useState(null);
  const [step2Data, setStep2Data] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef();
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandError, setNewBrandError] = useState("");

  const brandCreateMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: (res) => {
      const brand = res.data.data ?? res.data;
      toast.success("Marca creada");
      qc.invalidateQueries({ queryKey: ["brands"] });
      form1.setValue("brand_id", brand.id);
      setBrandDialogOpen(false);
      setNewBrandName("");
      setNewBrandError("");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message ?? "Error al crear marca"),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories().then((r) => r.data.data ?? r.data),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers().then((r) => r.data.data ?? r.data),
    enabled: isAdmin,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => getBrands().then((r) => r.data.data ?? r.data),
  });

  const { data: supportTypes } = useQuery({
    queryKey: ["support-types"],
    queryFn: () => getSupportTypes().then((r) => r.data.data ?? r.data),
  });

  const categoryList = Array.isArray(categories)
    ? categories
    : (categories?.data ?? []);
  const userList = Array.isArray(users) ? users : (users?.data ?? []);
  const brandList = Array.isArray(brands) ? brands : (brands?.data ?? []);
  const supportTypeList = Array.isArray(supportTypes)
    ? supportTypes
    : (supportTypes?.data ?? []);

  const form1 = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      brand_id: '',
      model: '',
      serial_number: '',
      description: '',
      problem_description: '',
    },
  });
  const form2 = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      support_type_id: '',
      category_id: '',
      reception_date: today,
      estimated_return_date: '',
      technician_id: '',
      warranty_days: '',
      advance_payment: '',
      internal_notes: '',
    },
  });

  const handleStep1Submit = (values) => {
    if (!selectedCustomer) {
      setCustomerError("Selecciona o crea un cliente");
      return;
    }
    setCustomerError("");
    setStep1Data(values);
    setCurrentStep(2);
  };

  const handleStep2Submit = (values) => {
    if (isAdmin && !values.technician_id) {
      form2.setError("technician_id", { message: "Selecciona un técnico" });
      return;
    }
    setStep2Data(values);
    setCurrentStep(3);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 3 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos((prev) => [...prev, ...toAdd]);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFinalSubmit = async () => {
    if (photos.length === 0) {
      toast.error("Agrega al menos una foto");
      return;
    }
    setIsSubmitting(true);
    try {
      const ticketPayload = {
        ...step1Data,
        ...step2Data,
        ...(selectedCustomer?.type === "existing"
          ? { customer_id: selectedCustomer.customer.id }
          : { new_customer: selectedCustomer?.customer }),
        technician_id: isAdmin
          ? step2Data?.technician_id || undefined
          : user.id,
        warranty_days: step2Data?.warranty_days
          ? parseInt(step2Data.warranty_days)
          : undefined,
        advance_payment: step2Data?.advance_payment
          ? parseFloat(step2Data.advance_payment)
          : undefined,
        category_id: step2Data?.category_id
          ? parseInt(step2Data.category_id)
          : undefined,
        support_type_id: step2Data?.support_type_id
          ? parseInt(step2Data.support_type_id)
          : undefined,
        brand_id: step1Data?.brand_id ? parseInt(step1Data.brand_id) : undefined,
      };

      const res = await createTicket(ticketPayload);
      const ticket = res.data.data ?? res.data;

      for (const photo of photos) {
        const fd = new FormData();
        fd.append("photo", photo);
        await uploadPhoto(ticket.id, fd);
      }

      toast.success("Ticket creado correctamente");
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Error al crear el ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo Ticket</h1>
        <p className="text-muted-foreground">
          Registra una nueva solicitud de soporte técnico
        </p>
      </div>

      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Herramienta y Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form1.handleSubmit(handleStep1Submit)}
              className="flex flex-col gap-4"
            >
              <CustomerSearch
                onSelect={setSelectedCustomer}
                selected={selectedCustomer}
              />
              {customerError && (
                <p className="text-sm text-destructive">{customerError}</p>
              )}

              <Field>
                <FieldLabel>Descripción del equipo *</FieldLabel>
                <Input
                  placeholder="Ej. Color negro, con cable rojo..."
                  aria-invalid={!!form1.formState.errors.description}
                  {...form1.register("description")}
                />
                {form1.formState.errors.description && (
                  <FieldError>{form1.formState.errors.description.message}</FieldError>
                )}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel>Marca *</FieldLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 -mr-1"
                          onClick={() => setBrandDialogOpen(true)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Nueva marca</TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={
                      form1.watch("brand_id")
                        ? String(form1.watch("brand_id"))
                        : ""
                    }
                    onValueChange={(v) =>
                      form1.setValue("brand_id", v, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="w-full" aria-invalid={!!form1.formState.errors.brand_id}>
                      <SelectValue placeholder="Seleccione una marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {brandList.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {form1.formState.errors.brand_id && (
                    <FieldError>
                      {form1.formState.errors.brand_id.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Modelo *</FieldLabel>
                  <Input
                    placeholder="Ej. GSB 120"
                    aria-invalid={!!form1.formState.errors.model}
                    {...form1.register("model")}
                  />
                  {form1.formState.errors.model && (
                    <FieldError>
                      {form1.formState.errors.model.message}
                    </FieldError>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel>Número de serie</FieldLabel>
                <Input
                  placeholder="Número de serie (opcional)"
                  {...form1.register("serial_number")}
                />
              </Field>

              <Field>
                <FieldLabel>Descripción del problema *</FieldLabel>
                <Textarea
                  placeholder="Ej. No enciende, hace ruido al girar..."
                  rows={3}
                  aria-invalid={!!form1.formState.errors.problem_description}
                  {...form1.register("problem_description")}
                />
                {form1.formState.errors.problem_description && (
                  <FieldError>
                    {form1.formState.errors.problem_description.message}
                  </FieldError>
                )}
              </Field>

              <div className="flex justify-end">
                <Button type="submit">
                  Siguiente
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Datos del Soporte</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form2.handleSubmit(handleStep2Submit)}
              className="flex flex-col gap-4"
            >
              <Field>
                <FieldLabel>Tipo de soporte *</FieldLabel>
                <Select
                  onValueChange={(v) => form2.setValue("support_type_id", v, { shouldValidate: true })}
                >
                  <SelectTrigger aria-invalid={!!form2.formState.errors.support_type_id}>
                    <SelectValue placeholder="Seleccione un tipo de soporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {supportTypeList.map((st) => (
                        <SelectItem key={st.id} value={String(st.id)}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {form2.formState.errors.support_type_id && (
                  <FieldError>
                    {form2.formState.errors.support_type_id.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Categoría *</FieldLabel>
                <Select onValueChange={(v) => form2.setValue("category_id", v, { shouldValidate: true })}>
                  <SelectTrigger aria-invalid={!!form2.formState.errors.category_id}>
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categoryList.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {form2.formState.errors.category_id && (
                  <FieldError>
                    {form2.formState.errors.category_id.message}
                  </FieldError>
                )}
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Fecha de recepción *</FieldLabel>
                  <Input type="date" aria-invalid={!!form2.formState.errors.reception_date} {...form2.register("reception_date")} />
                  {form2.formState.errors.reception_date && (
                    <FieldError>
                      {form2.formState.errors.reception_date.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Entrega estimada</FieldLabel>
                  <Input
                    type="date"
                    {...form2.register("estimated_return_date")}
                  />
                </Field>
              </div>

              {isAdmin && (
                <Field>
                  <FieldLabel>Técnico asignado *</FieldLabel>
                  <Select
                    onValueChange={(v) => form2.setValue("technician_id", v)}
                  >
                    <SelectTrigger aria-invalid={!!form2.formState.errors.technician_id}>
                      <SelectValue placeholder="Seleccione un técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {userList.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {form2.formState.errors.technician_id && (
                    <FieldError>{form2.formState.errors.technician_id.message}</FieldError>
                  )}
                </Field>
              )}

              <Field>
                <FieldLabel>Días de garantía</FieldLabel>
                <Input
                  type="number"
                  placeholder="Ej. 30 (opcional)"
                  {...form2.register("warranty_days")}
                />
              </Field>

              <Field>
                <FieldLabel>Adelanto</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Monto adelantado (opcional)"
                  {...form2.register("advance_payment")}
                />
              </Field>

              <Field>
                <FieldLabel>Notas internas</FieldLabel>
                <Textarea
                  placeholder="Notas internas (opcional)"
                  rows={2}
                  {...form2.register("internal_notes")}
                />
              </Field>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  <ChevronLeft data-icon="inline-start" />
                  Anterior
                </Button>
                <Button type="submit">
                  Siguiente
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Fotos del equipo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Agrega entre 1 y 3 fotos del equipo recibido.
            </p>

            {previews.length < 3 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-8 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="size-8" />
                <span className="text-sm">Haz clic para seleccionar fotos</span>
                <span className="text-xs">
                  JPG, PNG, WEBP — máx. {3 - previews.length} foto(s) más
                </span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative rounded-md overflow-hidden aspect-square bg-muted"
                  >
                    <img
                      src={src}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:opacity-80"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(2)}
              >
                <ChevronLeft data-icon="inline-start" />
                Anterior
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting || photos.length === 0}
              >
                {isSubmitting ? "Creando ticket..." : "Crear Ticket"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brand create dialog */}
      <Dialog
        open={brandDialogOpen}
        onOpenChange={(v) => {
          if (!v) {
            setNewBrandName("");
            setNewBrandError("");
          }
          setBrandDialogOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva Marca</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel>Nombre *</FieldLabel>
            <Input
              placeholder="Ej. Bosch, Dewalt..."
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
            />
            {newBrandError && <FieldError>{newBrandError}</FieldError>}
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!newBrandName.trim()) {
                  setNewBrandError("El nombre es requerido");
                  return;
                }
                setNewBrandError("");
                brandCreateMutation.mutate({ name: newBrandName.trim() });
              }}
              disabled={brandCreateMutation.isPending}
            >
              {brandCreateMutation.isPending ? "Creando..." : "Crear marca"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
