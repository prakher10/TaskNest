import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Users, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { CreateProjectModal } from "@/components/common/CreateProjectModal";
import { projectsApi, type ApiProject } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Projects() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ApiProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list({ limit: 100 }),
  });

  const projects: ApiProject[] = data?.data.projects ?? [];
  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteTarget._id);
      toast.success(`"${deleteTarget.title}" deleted`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${projects.length} active project${projects.length !== 1 ? "s" : ""} in your workspace`}
          </p>
        </div>
        {isAdmin && (
          <AnimatedButton
            onClick={() => setOpen(true)}
            label="+ Create Project"
            className="px-8 h-11"
          />
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20 text-center">
          <p className="text-muted-foreground">
            {query
              ? "No projects match your search."
              : isAdmin
                ? "No projects yet. Create your first one!"
                : "You haven't been added to any projects yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const memberInitials = (p.members ?? []).slice(0, 4).map((m) =>
              m.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            );
            return (
              <div key={p._id} className="relative group">
                {/* ── Delete X button — Admin only, visible on hover ── */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(p);
                    }}
                    className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-md opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110"
                    title="Delete project"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                <Link to={`/projects/${p._id}`}>
                  <Card className="group h-full overflow-hidden border-border/60 shadow-elegant transition-all hover:-translate-y-1 hover:shadow-elegant-lg">
                    <div className="h-2 bg-gradient-primary" />
                    <div className="space-y-4 p-5">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
                          {p.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {p.description || "No description."}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Members</span>
                          <span className="font-medium">{p.membersCount ?? p.members?.length ?? 0}</span>
                        </div>
                        <Progress value={0} className="h-1.5" />
                      </div>
                      <div className="flex items-center justify-between border-t border-border/60 pt-3">
                        <div className="flex -space-x-2">
                          {memberInitials.map((init, i) => (
                            <Avatar key={i} className="h-7 w-7 border-2 border-card">
                              <AvatarFallback className="bg-gradient-primary text-[10px] font-semibold text-primary-foreground">
                                {init}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" /> {p.membersCount ?? p.members?.length ?? 0} members
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <CreateProjectModal open={open} onOpenChange={setOpen} onCreated={handleCreated} />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all its tasks. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
