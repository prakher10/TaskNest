import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, ListTodo, AlertTriangle, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { dashboardApi, type ApiTask } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Map backend priority to the format PriorityBadge expects
const normPriority = (p: string) => p.toLowerCase() as "low" | "medium" | "high";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get(),
  });

  const stats = data?.data.stats;
  const projects = data?.data.projects ?? [];
  const recentTasks: ApiTask[] = data?.data.recentTasks ?? [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground">Here's what's happening across your workspace today.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard label="Total Tasks" value={stats?.totalTasks ?? 0} icon={ListTodo} variant="primary" trend={`${stats?.totalProjects ?? 0} projects`} />
            <StatCard label="Completed" value={stats?.completedTasks ?? 0} icon={CheckCircle2} variant="success" trend="Done" />
            <StatCard label="Pending" value={stats?.pendingTasks ?? 0} icon={Clock} variant="warning" trend="In queue" />
            <StatCard label="Overdue" value={stats?.overdueTasks ?? 0} icon={AlertTriangle} variant="destructive" trend="Needs attention" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active projects */}
        <Card className="lg:col-span-2 p-6 shadow-elegant">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Active projects</h2>
              <p className="text-sm text-muted-foreground">Progress across your top projects</p>
            </div>
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div className="space-y-5">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)
              : projects.length === 0
              ? <p className="text-sm text-muted-foreground">No projects yet.</p>
              : projects.slice(0, 5).map((p) => (
                  <div key={p._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                        <span className="text-sm font-medium">{p.title}</span>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">{p.progress ?? 0}%</span>
                    </div>
                    <Progress value={p.progress ?? 0} className="h-2" />
                  </div>
                ))}
          </div>
        </Card>

        {/* Recent tasks */}
        <Card className="p-6 shadow-elegant">
          <h2 className="mb-5 text-lg font-semibold">Recent tasks</h2>
          <div className="space-y-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)
              : recentTasks.length === 0
              ? <p className="text-sm text-muted-foreground">No tasks yet.</p>
              : recentTasks.map((t) => {
                  const assigneeInitials = t.assignedTo?.name
                    ? t.assignedTo.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "?";
                  return (
                    <div key={t._id} className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                          {assigneeInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <PriorityBadge priority={normPriority(t.priority)} />
                          {t.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </Card>
      </div>
    </div>
  );
}
