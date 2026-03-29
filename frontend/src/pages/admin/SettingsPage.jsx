import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { getSettings, updateSettings } from '@/api/settings.api'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'

const GROUP_LABELS = {
  finance: 'Finanzas',
  tickets: 'Tickets',
  schedule: 'Horarios',
  general: 'General',
}

export default function SettingsPage() {
  const [values, setValues] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings().then((r) => r.data.data),
  })

  // Initialize local state when data loads
  useEffect(() => {
    if (!data) return
    const flat = {}
    Object.values(data).forEach((group) => {
      group.forEach((s) => { flat[s.key] = s.value ?? '' })
    })
    setValues(flat)
  }, [data])

  const reload = useAppStore((s) => s.reload)

  const mutation = useMutation({
    mutationFn: (settings) => updateSettings(settings),
    onSuccess: () => { toast.success('Configuración guardada'); reload() },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'Error al guardar'),
  })

  const handleSave = () => {
    const settings = Object.entries(values).map(([key, value]) => ({ key, value }))
    mutation.mutate(settings)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    )
  }

  if (!data) return null

  const groups = Object.entries(data)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parámetros del sistema</h1>
          <p className="text-muted-foreground">Configuración general de la aplicación</p>
        </div>
        <Button onClick={handleSave} disabled={mutation.isPending}>
          <Save data-icon="inline-start" />
          {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      {groups.map(([group, settings]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-base">{GROUP_LABELS[group] ?? group}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {settings.map((setting, i) => (
              <div key={setting.key}>
                {i > 0 && <Separator className="mb-4" />}
                <Field>
                  <FieldLabel>{setting.label}</FieldLabel>
                  <Input
                    type={setting.type === 'integer' || setting.type === 'decimal' ? 'number' : 'text'}
                    step={setting.type === 'decimal' ? '0.01' : setting.type === 'integer' ? '1' : undefined}
                    value={values[setting.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [setting.key]: e.target.value }))}
                  />
                </Field>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
