import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wrench, Package, CheckCircle2, DollarSign, TrendingUp, TrendingDown, Printer } from 'lucide-react'
import { getSummary, getByStatus, getBySupportType, getCosts, getFinancial } from '@/api/reports.api'
import { formatCurrency } from '@/utils/formatters'
import { TICKET_STATUSES } from '@/utils/constants'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

function KpiCard({ title, value, icon: Icon, description }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

function ResumenTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['summary'],
    queryFn: () => getSummary().then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard title="Tickets Activos" value={data?.active_tickets ?? 0} icon={Wrench} description="En proceso" />
      <KpiCard title="Listos para Entregar" value={data?.ready_for_delivery ?? 0} icon={Package} description="Esperando retiro" />
      <KpiCard title="Entregados este Mes" value={data?.delivered_this_month ?? 0} icon={CheckCircle2} description="Este mes" />
      <KpiCard title="Ingresos del Mes" value={formatCurrency(data?.monthly_income ?? 0)} icon={DollarSign} description="Este mes" />
    </div>
  )
}

function ByStatusTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-by-status'],
    queryFn: () => getByStatus().then((r) => r.data.data ?? r.data),
  })

  const chartData = Array.isArray(data)
    ? data.map((d) => ({ name: TICKET_STATUSES[d.status]?.label ?? d.status, value: d.count ?? d.total ?? 0 }))
    : Object.entries(TICKET_STATUSES).map(([key, { label }]) => ({
        name: label,
        value: data?.[key] ?? 0,
      }))

  if (isLoading) return <Skeleton className="h-80 w-full" />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets por Estado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={140} />
            <Tooltip />
            <Bar dataKey="value" name="Tickets" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function BySupportTypeTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-by-support-type'],
    queryFn: () => getBySupportType().then((r) => r.data.data ?? r.data),
  })

  const chartData = Array.isArray(data)
    ? data.map((d) => ({ name: d.name ?? 'Sin tipo', value: d.count ?? 0 }))
    : []

  if (isLoading) return <Skeleton className="h-80 w-full" />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets por Tipo de Soporte</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
              {chartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function CostsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-costs'],
    queryFn: () => getCosts().then((r) => r.data.data ?? r.data),
  })

  const chartData = Array.isArray(data)
    ? data.map((d) => ({ month: d.month ?? d.period, labor: d.labor_cost ?? 0, parts: d.parts_cost ?? 0 }))
    : []

  if (isLoading) return <Skeleton className="h-80 w-full" />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Costos — últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(val) => formatCurrency(val)} />
            <Legend />
            <Bar dataKey="labor" name="Mano de obra" stackId="a" fill="hsl(var(--chart-1))" />
            <Bar dataKey="parts" name="Repuestos" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function FinancialTab() {
  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [dateFrom, setDateFrom] = useState(firstOfMonth)
  const [dateTo, setDateTo] = useState(today)

  const { data, isLoading } = useQuery({
    queryKey: ['reports-financial', dateFrom, dateTo],
    queryFn: () => getFinancial({ date_from: dateFrom, date_to: dateTo }).then((r) => r.data.data),
  })

  const summary = data?.summary
  const tickets = data?.tickets ?? []

  const marginColor = (summary?.profit_margin ?? 0) >= 0 ? 'text-green-600' : 'text-destructive'

  const handlePrint = () => {
    const rows = tickets.map((t) => `
      <tr>
        <td>${t.ticket_number}</td>
        <td>${t.customer ?? '—'}</td>
        <td>${t.technician ?? '—'}</td>
        <td>${t.delivery_date ?? '—'}</td>
        <td class="text-right">${formatCurrency(t.labor_cost)}</td>
        <td class="text-right">${formatCurrency(t.parts_cost)}</td>
        <td class="text-right font-medium">${formatCurrency(t.total_cost)}</td>
      </tr>`).join('')

    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>Reporte Financiero ${dateFrom} – ${dateTo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: sans-serif; font-size: 12px; color: #111; padding: 24px; }
        h2 { font-size: 16px; margin-bottom: 4px; }
        p { color: #555; margin-bottom: 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f4f4f5; text-align: left; padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #e5e7eb; }
        td { padding: 5px 8px; border-bottom: 1px solid #f1f1f1; font-size: 11px; }
        .text-right { text-align: right; }
        .font-medium { font-weight: 600; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h2>Reporte Financiero</h2>
      <p>Período: ${dateFrom} – ${dateTo} · ${summary?.ticket_count ?? 0} tickets entregados</p>
      <table>
        <thead><tr>
          <th>Ticket</th><th>Cliente</th><th>Técnico</th><th>Entrega</th>
          <th style="text-align:right">Mano de obra</th>
          <th style="text-align:right">Repuestos</th>
          <th style="text-align:right">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 250)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls — outside printable area */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Desde</span>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hasta</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5" disabled={isLoading || tickets.length === 0}>
          <Printer className="size-4" />
          Imprimir
        </Button>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos</CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(summary?.total_revenue ?? 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mano de obra</CardTitle>
              <Wrench className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(summary?.total_labor_cost ?? 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gasto en repuestos</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(summary?.total_parts_cost ?? 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ganancia bruta</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(summary?.gross_profit ?? 0) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(summary?.gross_profit ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Margen</CardTitle>
              <TrendingDown className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${marginColor}`}>{summary?.profit_margin ?? 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">{summary?.ticket_count ?? 0} tickets entregados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tickets table */}
      <Card>
        <CardHeader><CardTitle>Detalle por ticket</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Mano de obra</TableHead>
                <TableHead className="text-right">Repuestos</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{[1,2,3,4,5,6,7].map((j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                ))
              ) : tickets.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Sin tickets entregados en el período</TableCell></TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link to={`/tickets/${t.id}`} className="font-medium underline underline-offset-2 hover:text-primary">{t.ticket_number}</Link>
                    </TableCell>
                    <TableCell>{t.customer ?? '—'}</TableCell>
                    <TableCell>{t.technician ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{t.delivery_date}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.labor_cost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.parts_cost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(t.total_cost)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Métricas y estadísticas del centro de soporte</p>
      </div>
      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="por-estado">Por Estado</TabsTrigger>
          <TabsTrigger value="por-tipo">Por Tipo de Soporte</TabsTrigger>
          <TabsTrigger value="costos">Costos</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen" className="mt-4">
          <ResumenTab />
        </TabsContent>
        <TabsContent value="por-estado" className="mt-4">
          <ByStatusTab />
        </TabsContent>
        <TabsContent value="por-tipo" className="mt-4">
          <BySupportTypeTab />
        </TabsContent>
        <TabsContent value="costos" className="mt-4">
          <CostsTab />
        </TabsContent>
        <TabsContent value="financiero" className="mt-4">
          <FinancialTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
