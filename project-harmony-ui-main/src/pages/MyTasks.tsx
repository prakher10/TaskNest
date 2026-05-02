import { useState } from "react";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/common/TaskCard";
import { CreateTaskModal } from "@/components/common/CreateTaskModal";
import { tasksApi, type ApiTask } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

type TaskStatus = "Pending" | "In Progress" | "Completed";

const columns: { key: TaskStatus; title: string; dot: string }[] = [
  { key: "Pending", title: "Pending", dot: "bg-muted-foreground" },
  { key: "In Progress", title: "In Progress", dot: "bg-info" },
  { key: "Completed", title: "Completed", dot: "bg-success" },
];

export default function MyTasks() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list({ limit: 100 }),
  });

  const tasks: ApiTask[] = data?.data.tasks ?? [];

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // Member: allow status update on their assigned tasks
  const handleStatusUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "All tasks across your projects, organized Kanban-style."
              : "Tasks assigned to you, organized Kanban-style."}
          </p>
        </div>
        {isAdmin && (
          <AnimatedButton
            onClick={() => setOpen(true)}
            label="+ New Task"
            className="px-8 h-11"
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
              <div className="mb-3 flex items-center px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {colTasks.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <Skeleton className="h-20 rounded-lg" />
                ) : colTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                    No tasks here yet
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      onStatusUpdated={handleStatusUpdate}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <CreateTaskModal open={open} onOpenChange={setOpen} onCreated={handleCreated} />
      )}
    </div>
  );
}
