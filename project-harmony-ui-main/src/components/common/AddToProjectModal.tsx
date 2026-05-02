import { useState } from "react";
import { FolderKanban, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { projectsApi, type ApiUser, type ApiProject } from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: ApiUser;
  projects: ApiProject[];
  onAdded?: () => void;
}

export function AddToProjectModal({ open, onOpenChange, user, projects, onAdded }: Props) {
  const [loading, setLoading] = useState<string | null>(null); // projectId being added

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const isAlreadyMember = (project: ApiProject) =>
    project.members?.some((m) => m._id === user._id);

  const addToProject = async (project: ApiProject) => {
    if (isAlreadyMember(project)) return;
    setLoading(project._id);
    try {
      await projectsApi.addMembers(project._id, [user._id]);
      toast.success(`${user.name} added to "${project.title}"`);
      onAdded?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to project</DialogTitle>
          <DialogDescription>
            Select a project to add{" "}
            <span className="font-medium text-foreground">{user.name}</span> to.
          </DialogDescription>
        </DialogHeader>

        {/* User preview */}
        <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="secondary" className="ml-auto">{user.role}</Badge>
        </div>

        {/* Project list */}
        {projects.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <FolderKanban className="mx-auto mb-2 h-8 w-8 opacity-40" />
            No projects yet. Create one first.
          </div>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-2 pr-2">
              {projects.map((p) => {
                const already = isAlreadyMember(p);
                return (
                  <div
                    key={p._id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      already
                        ? "border-border/40 bg-secondary/50 opacity-60"
                        : "border-border/60 hover:bg-accent/50 cursor-pointer"
                    }`}
                    onClick={() => !already && addToProject(p)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.members?.length ?? 0} members</p>
                      </div>
                    </div>
                    {already ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <Check className="h-3.5 w-3.5" /> Member
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs"
                        disabled={loading === p._id}
                        onClick={(e) => { e.stopPropagation(); addToProject(p); }}
                      >
                        {loading === p._id ? "Adding…" : "Add"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
