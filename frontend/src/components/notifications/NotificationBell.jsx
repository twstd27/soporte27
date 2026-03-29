import { useState } from "react";
import { Bell, Check, CheckCheck, Package, Wrench } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "@/api/notifications.api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  ticket_assigned: Wrench,
  ticket_delivered: Package,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications().then((r) => r.data),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleNotificationClick = (notification) => {
    if (!notification.read_at) {
      readMutation.mutate(notification.id);
    }
    setOpen(false);
    navigate(`/tickets/${notification.data.ticket_id}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificaciones"
          className="relative"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
            >
              <CheckCheck className="size-3" />
              Marcar todas
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Bell className="size-8 opacity-30" />
              <span className="text-sm">Sin notificaciones</span>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              const isUnread = !n.read_at;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-0",
                    isUnread && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      isUnread
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        isUnread && "font-medium",
                      )}
                    >
                      {n.data.message}
                    </p>
                    {n.data.customer_name && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {n.data.customer_name} · {n.data.model}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
