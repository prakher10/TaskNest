import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { tasksApi, projectsApi, type ApiUser, type ApiProject } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** If provided, task is locked to this project (Project Detail page) */
  projectId?: string;
  /** Members of the locked project */
  projectMembers?: ApiUser[];
  onCreated?: () => void;
}

export function CreateTaskModal({ open, onOpenChange, projectId, projectMembers = [], onCreated }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Pending");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("unassigned");
  const [loading, setLoading] = useState(false);

  // Project selector — only used when no projectId is pre-supplied (My Tasks page)
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<ApiUser[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const needsProjectPicker = !projectId; // true on My Tasks page

  // Load projects when modal opens and no projectId is pre-supplied
  useEffect(() => {
    if (!open || !needsProjectPicker) return;
    setLoadingProjects(true);
    projectsApi
      .list({ limit: 100 })
      .then((res) => {
        const list = res.data.projects ?? [];
        setProjects(list);
        if (list.length === 1) {
          // Auto-select if only one project
          setSelectedProjectId(list[0]._id);
          setSelectedProjectMembers(list[0].members ?? []);
        }
      })
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoadingProjects(false));
  }, [open, needsProjectPicker]);

  // When user picks a project, update the members list for the assign dropdown
  const handleProjectChange = (pid: string) => {
    setSelectedProjectId(pid);
    setAssignedTo("unassigned");
    const proj = projects.find((p) => p._id === pid);
    setSelectedProjectMembers(proj?.members ?? []);
  };

  const reset = () => {
    setTitle("");
    setStatus("Pending");
    setPriority("Medium");
    setDueDate("");
    setAssignedTo("unassigned");
    setSelectedProjectId("");
    setSelectedProjectMembers([]);
  };

  // Resolve the final projectId and members to use
  const finalProjectId = projectId ?? selectedProjectId;
  const finalMembers = projectId ? projectMembers : selectedProjectMembers;

  const submit = async () => {
    if (!title.trim()) return toast.error("Task title is required");
    if (!finalProjectId) return toast.error("Please select a project");

    setLoading(true);
    try {
      await tasksApi.create({
        title: title.trim(),
        status,
        priority,
        dueDate: dueDate || undefined,
        assignedTo: assignedTo !== "unassigned" ? assignedTo : undefined,
        projectId: finalProjectId,
      });
      toast.success(`Task "${title}" created`);
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">

          {/* Project selector — only shown on My Tasks page */}
          {needsProjectPicker && (
            <div className="space-y-2">
              <Label>Project <span className="text-destructive">*</span></Label>
              {loadingProjects ? (
                <div className="h-10 animate-pulse rounded-md bg-secondary" />
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No projects yet.{isAdmin ? " Create one first." : " Ask your Admin to add you to a project."}
                </p>
              ) : (
                <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project…" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="t-title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="t-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label htmlFor="t-due">Due date</Label>
            <Input id="t-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {/* Assign to — only for Admins when members are available */}
          {isAdmin && finalMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {finalMembers.map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }} disabled={loading}>
            Cancel
          </Button>
          <AnimatedButton
            onClick={submit}
            disabled={loading || (needsProjectPicker && !selectedProjectId) || (projects.length === 0 && needsProjectPicker)}
            label={loading ? "Adding…" : "Add task"}
            className="h-11 w-full"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
