import {
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Settings,
  CheckCircle2,
  UserPlus,
  UserMinus,
  AlertTriangle,
  Clock,
  ClipboardList,
  FolderKanban,
  BellOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { notificationsApi, type ApiNotification } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationIcon({ type }: { type: string }) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "task_status_updated":
      return <CheckCircle2 className={`${cls} text-green-500`} />;
    case "project_member_added":
      return <UserPlus className={`${cls} text-blue-500`} />;
    case "project_member_removed":
      return <UserMinus className={`${cls} text-orange-500`} />;
    case "task_overdue":
      return <AlertTriangle className={`${cls} text-destructive`} />;
    case "task_due_soon":
      return <Clock className={`${cls} text-yellow-500`} />;
    case "task_assigned":
      return <ClipboardList className={`${cls} text-purple-500`} />;
    case "project_updated":
      return <FolderKanban className={`${cls} text-indigo-500`} />;
    default:
      return <Bell className={`${cls} text-muted-foreground`} />;
  }
}

// ─── Notification item ────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: ApiNotification;
  onMarkRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  return (
    <button
      onClick={() => !notification.read && onMarkRead(notification._id)}
      className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent ${notification.read ? "opacity-60" : ""
        }`}
    >
      {/* Unread indicator */}
      <span
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-transparent" : "bg-blue-500"
          }`}
      />
      <NotificationIcon type={notification.type} />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{notification.message}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

// ─── TopNavbar ────────────────────────────────────────────────────────────────

export function TopNavbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30_000,
    select: (res) => res.data,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast.error("Failed to mark all as read.");
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationsApi.clearAll();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast.error("Failed to clear notifications.");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?";

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />

      <div className="relative ml-2 hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects, tasks, people…"
          className="h-10 border-transparent bg-secondary pl-9 focus-visible:bg-background"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* ── Notifications Bell ── */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-[380px] p-0"
            sideOffset={8}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={handleClearAll}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all">
              <TabsList className="w-full rounded-none border-b bg-transparent px-4 py-0 h-9">
                <TabsTrigger
                  value="all"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full text-xs"
                >
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-full text-xs"
                >
                  Unread ({unreadCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <ScrollArea className="h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                      <BellOff className="h-8 w-8 opacity-40" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {notifications.map((n) => (
                        <NotificationItem
                          key={n._id}
                          notification={n}
                          onMarkRead={handleMarkRead}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                <ScrollArea className="h-[400px]">
                  {unreadNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 opacity-40" />
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {unreadNotifications.map((n) => (
                        <NotificationItem
                          key={n._id}
                          notification={n}
                          onMarkRead={handleMarkRead}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>

        {/* ── User Menu ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 transition hover:bg-accent">
              <Avatar className="h-9 w-9 border-2 border-background shadow-elegant">
                {user?.avatar && (
                  <AvatarImage
                    src={user.avatar}
                    alt={user.name}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-gradient-primary text-sm font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight">
                  {user?.name ?? "…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email ?? ""}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <UserIcon className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
