import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Building2, Upload } from "lucide-react";
import { getCompany, updateCompany } from "@/api/settings.api";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";

const EMPTY = {
  name: "",
  tax_id: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  description: "",
};

export default function CompanyPage() {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: () => getCompany().then((r) => r.data.data),
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      tax_id: data.tax_id ?? "",
      address: data.address ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      website: data.website ?? "",
      description: data.description ?? "",
    });
    if (data.logo_url) setLogoPreview(data.logo_url);
  }, [data?.id]);

  const reload = useAppStore((s) => s.reload);

  const mutation = useMutation({
    mutationFn: (fd) => updateCompany(fd),
    onSuccess: () => {
      toast.success("Datos de empresa actualizados");
      qc.invalidateQueries({ queryKey: ["company"] });
      setLogoFile(null);
      reload();
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message ?? "Error al guardar"),
  });

  const handleSave = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });
    if (logoFile) fd.append("logo", logoFile);
    mutation.mutate(fd);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Datos de la empresa
          </h1>
          <p className="text-muted-foreground">
            Información de tu centro de soporte
          </p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          <Save data-icon="inline-start" />
          {mutation.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="size-32 rounded-xl border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-muted/30">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="size-10 text-muted-foreground" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload data-icon="inline-start" />
              Cambiar logo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Información general</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field className="sm:col-span-2">
              <FieldLabel>Nombre de la empresa *</FieldLabel>
              <Input
                placeholder="Nombre..."
                value={form.name}
                onChange={set("name")}
              />
            </Field>
            <Field>
              <FieldLabel>NIT</FieldLabel>
              <Input value={form.tax_id} onChange={set("tax_id")} />
            </Field>
            <Field>
              <FieldLabel>Teléfono</FieldLabel>
              <Input value={form.phone} onChange={set("phone")} />
            </Field>
            <Field>
              <FieldLabel>Correo electrónico</FieldLabel>
              <Input type="email" value={form.email} onChange={set("email")} />
            </Field>
            <Field>
              <FieldLabel>Sitio web</FieldLabel>
              <Input value={form.website} onChange={set("website")} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Dirección</FieldLabel>
              <Input value={form.address} onChange={set("address")} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Descripción</FieldLabel>
              <Textarea
                rows={3}
                placeholder="Descripción del centro de soporte..."
                value={form.description}
                onChange={set("description")}
              />
            </Field>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
