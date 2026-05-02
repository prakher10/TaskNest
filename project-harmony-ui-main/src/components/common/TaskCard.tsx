import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PriorityBadge } from "./PriorityBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { tasksApi, type ApiTask } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type TaskStatus = "Pending" | "In Progress" | "Completed";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  Pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  "In Progress": { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  Completed: { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

interface Props {
  task: ApiTask;
  onStatusUpdated?: () => void;
}

export function TaskCard({ task, onStatusUpdated }: Props) {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const due = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const assigneeInitials = task.assignedTo?.name
    ? task.assignedTo.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const priority = task.priority.toLowerCase() as "low" | "medium" | "high";

  // A Member can update status only if this task is assigned to them
  const isAdmin = user?.role === "Admin";
  const isAssignedToMe = task.assignedTo?._id === user?._id;
  const canUpdateStatus = isAdmin || isAssignedToMe;

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (newStatus === task.status) return;
    setUpdating(true);
    try {
      await tasksApi.update(task._id, { status: newStatus });
      toast.success(`Status updated to "${newStatus}"`);
      onStatusUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["Pending"];

  return (
    <Card className="space-y-3 border-border/60 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-elegant">
      {/* Title + Priority */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug">{task.title}</h4>
        <PriorityBadge priority={priority} />
      </div>

      {/* Description */}
      {task.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      {/* Status badge — clickable dropdown if user can update */}
      <div>
        {canUpdateStatus ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={updating}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 ${statusCfg.className}`}
              >
                {updating ? "Updating…" : statusCfg.label}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={task.status === s ? "font-semibold" : ""}
                >
                  {s}
                  {task.status === s && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge className={`text-xs font-medium ${statusCfg.className}`} variant="outline">
            {statusCfg.label}
          </Badge>
        )}
      </div>

      {/* Footer: due date + assignee */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {due && (
            <span className={`flex items-center gap-1 ${task.isOverdue ? "text-destructive font-medium" : ""}`}>
              <Calendar className="h-3.5 w-3.5" /> {due}
              {task.isOverdue && " · Overdue"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {task.assignedTo && (
            <span className="text-xs text-muted-foreground">{task.assignedTo.name}</span>
          )}
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-primary text-[10px] font-semibold text-primary-foreground">
              {assigneeInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </Card>
  );
}
