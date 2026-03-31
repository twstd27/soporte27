import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Wrench,
  Package,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAuthStore } from "@/store/authStore";
import { getSummary, getTechnicianSummary } from "@/api/reports.api";
import { getTickets } from "@/api/tickets.api";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { TICKET_STATUSES } from "@/utils/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function KpiCard({ title, value, icon: Icon, description }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const statusInfo = TICKET_STATUSES[status];
  if (!statusInfo) return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
}

const STATUS_COLORS = {
  received: "#94a3b8",
  diagnosing: "#f59e0b",
  in_repair: "#3b82f6",
  waiting_parts: "#f97316",
  ready: "#10b981",
  delivered: "#6b7280",
};

function WeeklyTrendChart({ data }) {
  if (!data?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Tickets por día (últimos 7 días)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-border"
            />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <RechartsTooltip
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
              formatter={(v) => [v, "Tickets"]}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              fill="hsl(var(--primary))"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ByStatusChart({ data }) {
  if (!data?.length) return null;
  const chartData = data.map((item) => ({
    ...item,
    label: TICKET_STATUSES[item.status]?.label ?? item.status,
    color: STATUS_COLORS[item.status] ?? "#94a3b8",
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tickets por estado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              className="stroke-border"
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              dataKey="label"
              type="category"
              width={110}
              tick={{ fontSize: 11 }}
            />
            <RechartsTooltip
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
              formatter={(v) => [v, "Tickets"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["summary"],
    queryFn: () => getSummary().then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const activeTickets = data?.active_tickets ?? 0;
  const readyForDelivery = data?.ready_for_delivery ?? 0;
  const deliveredThisMonth = data?.delivered_this_month ?? 0;
  const incomeThisMonth = data?.monthly_income ?? data?.income_this_month ?? 0;
  const recentTickets = data?.recent_tickets ?? [];
  const weeklyTrend = data?.weekly_trend ?? [];
  const ticketsByStatus = data?.tickets_by_status
    ? Array.isArray(data.tickets_by_status)
      ? data.tickets_by_status
      : Object.entries(data.tickets_by_status).map(([status, count]) => ({
          status,
          count: Number(count),
        }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del centro de soporte
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tickets Activos"
          value={activeTickets}
          icon={Wrench}
          description="En proceso"
        />
        <KpiCard
          title="Listos para Entregar"
          value={readyForDelivery}
          icon={Package}
          description="Esperando retiro"
        />
        <KpiCard
          title="Entregados este Mes"
          value={deliveredThisMonth}
          icon={CheckCircle2}
          description="Este mes"
        />
        <KpiCard
          title="Ingresos del Mes"
          value={formatCurrency(incomeThisMonth)}
          icon={DollarSign}
          description="Este mes"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeeklyTrendChart data={weeklyTrend} />
        <ByStatusChart data={ticketsByStatus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tickets Recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentTickets.length === 0 ? (
            <div className="p-6">
              <Empty
                icon={Wrench}
                title="Sin tickets recientes"
                description="0 registros · No hay tickets registrados aún"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Ticket</TableHead>
                  <TableHead>Herramienta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Recepción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {ticket.ticket_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {ticket.brand?.name ? `${ticket.brand.name} ` : ""}
                      {ticket.model}
                    </TableCell>
                    <TableCell>{ticket.customer?.name ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>{formatDate(ticket.reception_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DOW_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const todayStr = new Date().toISOString().slice(0, 10);

function TicketCalendar({ tickets }) {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const year = current.getFullYear();
  const month = current.getMonth();

  // Group tickets by estimated_return_date
  const byDate = {};
  tickets.forEach((t) => {
    if (t.estimated_return_date) {
      const key = t.estimated_return_date;
      (byDate[key] = byDate[key] ?? []).push(t);
    }
  });

  // Build grid: leading nulls + days + trailing nulls
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTickets = selectedDay ? (byDate[selectedDay] ?? []) : [];

  const dotColor = (t, dateStr) => {
    if (t.status === "delivered") return "bg-muted-foreground/40";
    if (dateStr < todayStr) return "bg-destructive";
    if (t.status === "ready") return "bg-green-500";
    return "bg-primary";
  };

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            Calendario de entregas
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => {
                setCurrent(new Date(year, month - 1, 1));
                setSelectedDay(null);
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium w-36 text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => {
                setCurrent(new Date(year, month + 1, 1));
                setSelectedDay(null);
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {DOW_NAMES.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[52px]" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTickets = byDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = selectedDay === dateStr;
            const isOverdue =
              dateStr < todayStr &&
              dayTickets.some((t) => t.status !== "delivered");

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={cn(
                  "min-h-[52px] p-1 rounded-md flex flex-col items-center gap-1 transition-colors hover:bg-muted/60 focus:outline-none",
                  isSelected && "ring-2 ring-primary bg-primary/10",
                  isOverdue && !isSelected && "bg-destructive/5",
                )}
              >
                <span
                  className={cn(
                    "size-6 flex items-center justify-center rounded-full text-xs",
                    isToday && "bg-primary text-primary-foreground font-bold",
                    !isToday && isOverdue && "text-destructive font-semibold",
                  )}
                >
                  {day}
                </span>
                {dayTickets.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayTickets.slice(0, 4).map((t, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "size-1.5 rounded-full",
                          dotColor(t, dateStr),
                        )}
                      />
                    ))}
                    {dayTickets.length > 4 && (
                      <span className="text-[9px] text-muted-foreground leading-none">
                        +{dayTickets.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary inline-block" />
            En proceso
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-green-500 inline-block" />
            Listo
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-destructive inline-block" />
            Vencido
          </span>
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {selectedTickets.length > 0
                ? `${selectedTickets.length} ticket(s) — entrega ${formatDate(selectedDay)}`
                : `Sin tickets para ${formatDate(selectedDay)}`}
            </p>
            <div className="flex flex-col gap-1.5">
              {selectedTickets.map((t) => (
                <Link
                  key={t.id}
                  to={`/tickets/${t.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs bg-muted/50 hover:bg-muted transition-colors gap-2"
                >
                  <span className="font-medium shrink-0">
                    {t.ticket_number}
                  </span>
                  <span className="text-muted-foreground truncate flex-1">
                    {t.brand?.name ? `${t.brand.name} ` : ""}
                    {t.model}
                  </span>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TechnicianDashboard({ user }) {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["technician-summary"],
    queryFn: () => getTechnicianSummary().then((r) => r.data.data),
  });

  const { data: ticketsData } = useQuery({
    queryKey: ["tickets", { technician_id: user.id, per_page: 200 }],
    queryFn: () =>
      getTickets({ technician_id: user.id, per_page: 200 }).then((r) => r.data),
  });

  const allTickets = ticketsData?.data ?? [];
  const activeTickets = allTickets.filter((t) => t.status !== "delivered");

  const byStatusData = (stats?.tickets_by_status ?? []).map((item) => ({
    label: TICKET_STATUSES[item.status]?.label ?? item.status,
    count: item.count,
    color: STATUS_COLORS[item.status] ?? "#94a3b8",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Dashboard</h1>
        <p className="text-muted-foreground">
          Rendimiento y tickets asignados a ti
        </p>
      </div>

      {/* KPI row */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            title="Tickets activos"
            value={stats?.active_tickets ?? 0}
            icon={Wrench}
            description="Sin entregar"
          />
          <KpiCard
            title="Listos p/ entregar"
            value={stats?.ready_for_delivery ?? 0}
            icon={Package}
            description="Esperando retiro"
          />
          <KpiCard
            title="Entregados este mes"
            value={stats?.delivered_this_month ?? 0}
            icon={CheckCircle2}
            description="Este mes"
          />
          <KpiCard
            title="Vencidos"
            value={stats?.overdue_count ?? 0}
            icon={AlertTriangle}
            description={
              stats?.overdue_count > 0 ? "Requieren atención" : "Al día"
            }
          />
        </div>
      )}

      {/* Active tickets table */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-base">Tickets activos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeTickets.length === 0 ? (
            <div className="p-6">
              <Empty
                icon={Wrench}
                title="Sin tickets activos"
                description="0 registros · No tienes tickets activos actualmente"
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Ticket</TableHead>
                  <TableHead>Herramienta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entrega Est.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTickets.map((ticket) => {
                  const overdue =
                    ticket.estimated_return_date &&
                    ticket.estimated_return_date < todayStr;
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {ticket.ticket_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {ticket.brand?.name ? `${ticket.brand.name} ` : ""}
                        {ticket.model}
                      </TableCell>
                      <TableCell>{ticket.customer?.name ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            overdue && "text-destructive font-medium",
                          )}
                        >
                          {formatDate(ticket.estimated_return_date)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Status breakdown */}
        {byStatusData.length > 0 && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base">
                Mis tickets por estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={byStatusData}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    className="stroke-border"
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    formatter={(v) => [v, "Tickets"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {byStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        <TicketCalendar tickets={allTickets} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === "admin") return <AdminDashboard />;
  return <TechnicianDashboard user={user} />;
}
