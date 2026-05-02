import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Calendar, Users, UserPlus, Trash2, FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskCard } from "@/components/common/TaskCard";
import { CreateTaskModal } from "@/components/common/CreateTaskModal";
import { InviteMemberModal } from "@/components/common/InviteMemberModal";
import { projectsApi, tasksApi, type ApiTask } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type TaskStatus = "Pending" | "In Progress" | "Completed";

const columns: { key: TaskStatus; title: string; dot: string }[] = [
  { key: "Pending", title: "Pending", dot: "bg-muted-foreground" },
  { key: "In Progress", title: "In Progress", dot: "bg-info" },
  { key: "Completed", title: "Completed", dot: "bg-success" },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: projData, isLoading: projLoading, error: projError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
    retry: 1,
    staleTime: 0, // always refetch
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", { projectId: id }],
    queryFn: () => tasksApi.list({ projectId: id!, limit: 100 }),
    enabled: !!id,
    retry: false,
    staleTime: 0,
  });

  const project = projData?.data?.project ?? null;
  const tasks: ApiTask[] = tasksData?.data?.tasks ?? [];

  // Auto-redirect only on confirmed 404 (not while loading)
  useEffect(() => {
    if (!projLoading && !project && projError) {
      const t = setTimeout(() => navigate("/projects"), 3000);
      return () => clearTimeout(t);
    }
  }, [projLoading, project, projError, navigate]);

  // Show admin controls to any Admin user — backend enforces ownership on API calls
  const isAdmin = user?.role === "Admin";

  const handleTaskCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks", { projectId: id }] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleTaskUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks", { projectId: id }] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleMembersUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["project", id] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectsApi.delete(id!);
      toast.success(`Project "${project?.title}" deleted`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/projects");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
      setDeleting(false);
    }
  };

  if (projLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    // Still loading or genuine not found
    if (!projLoading && projError) {
      return (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center">
          <div className="rounded-full bg-muted p-6">
            <FolderKanban className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Project not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This project may have been deleted or you don't have access to it.
            </p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </div>
      );
    }
    return null;
  }

  const memberInitials = (m: { name: string }) =>
    m.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        {isAdmin && (
          <button
            onClick={() => setDeleteOpen(true)}
            className="group relative flex h-12 w-12 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-destructive bg-destructive/10 hover:bg-destructive/20 transition-all duration-300 shadow-sm"
            title="Delete project"
          >
            <svg
              viewBox="0 0 1.625 1.625"
              className="absolute -top-7 fill-destructive delay-100 group-hover:top-4 group-hover:animate-[spin_1.4s] group-hover:duration-1000"
              height="15"
              width="15"
            >
              <path
                d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195"
              ></path>
              <path
                d="M1.219.601h-.163A.1.1 0 0 1 .959.504V.341A.033.033 0 0 0 .926.309h-.26a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099v-.39a.033.033 0 0 0-.032-.033"
              ></path>
              <path
                d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016"
              ></path>
            </svg>
            <svg
              width="16"
              fill="none"
              viewBox="0 0 39 7"
              className="origin-right duration-500 group-hover:rotate-90 translate-y-1"
            >
              <line strokeWidth="4" stroke="currentColor" className="text-destructive" y2="5" x2="39" y1="5"></line>
              <line
                strokeWidth="3"
                stroke="currentColor"
                className="text-destructive"
                y2="1.5"
                x2="26.0357"
                y1="1.5"
                x1="12"
              ></line>
            </svg>
            <svg width="16" fill="none" viewBox="0 0 33 39" className="translate-y-1">
              <mask fill="white" id="path-1-inside-1_8_19">
                <path
                  d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
                ></path>
              </mask>
              <path
                mask="url(#path-1-inside-1_8_19)"
                fill="currentColor"
                className="text-destructive"
                d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
              ></path>
              <path strokeWidth="4" stroke="currentColor" className="text-destructive" d="M12 6L12 29"></path>
              <path strokeWidth="4" stroke="currentColor" className="text-destructive" d="M21 6V29"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Project header card */}
      <Card className="overflow-hidden border-border/60 shadow-elegant">
        <div className="h-2 bg-gradient-primary" />
        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <Badge variant="outline" className="bg-accent text-accent-foreground border-transparent">Active</Badge>
            <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
            <p className="text-muted-foreground">{project.description || "No description."}</p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {project.members?.length ?? 0} members
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
              <div className="flex -space-x-2">
                {(project.members ?? []).slice(0, 5).map((m) => (
                  <Avatar key={m._id} className="h-8 w-8 border-2 border-card">
                    <AvatarFallback className="bg-gradient-primary text-[11px] font-semibold text-primary-foreground">
                      {memberInitials(m)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)} className="gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" /> Manage
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Team members */}
      <Card className="p-6 shadow-elegant">
        <h2 className="mb-4 text-lg font-semibold">Team members</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(project.members ?? []).map((m) => (
            <div key={m._id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/50">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  {memberInitials(m)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="truncate text-xs text-muted-foreground">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Kanban board */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Kanban board grouped by status" : "Your assigned tasks"}
          </p>
        </div>
        {isAdmin && (
          <AnimatedButton
            onClick={() => setOpen(true)}
            label="+ Add Task"
            className="px-5 h-10"
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <h3 className="text-sm font-semibold">{col.title}</h3>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{colTasks.length}</Badge>
                </div>
                {isAdmin && (
                  <button onClick={() => setOpen(true)} className="rounded p-1 text-muted-foreground hover:bg-background">
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {tasksLoading ? (
                  <Skeleton className="h-20 rounded-lg" />
                ) : colTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                    No tasks here yet
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <TaskCard key={t._id} task={t} onStatusUpdated={handleTaskUpdated} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <CreateTaskModal
          open={open}
          onOpenChange={setOpen}
          projectId={id!}
          projectMembers={project.members ?? []}
          onCreated={handleTaskCreated}
        />
      )}

      {isAdmin && (
        <InviteMemberModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          project={project}
          onUpdated={handleMembersUpdated}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{project.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and{" "}
              <span className="font-semibold text-foreground">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              </span>{" "}
              inside it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Yes, delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
