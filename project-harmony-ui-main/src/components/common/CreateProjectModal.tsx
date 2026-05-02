import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { projectsApi } from "@/lib/api";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
}

export function CreateProjectModal({ open, onOpenChange, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) return toast.error("Project name is required");
    setLoading(true);
    try {
      await projectsApi.create({ title: title.trim(), description: desc.trim() });
      toast.success(`Project "${title}" created`);
      setTitle("");
      setDesc("");
      onOpenChange(false);
      onCreated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>Spin up a workspace for your team to collaborate.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="proj-name">Project name</Label>
            <Input
              id="proj-name"
              placeholder="e.g. Website Redesign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea
              id="proj-desc"
              placeholder="Briefly describe the project goals…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <AnimatedButton
            onClick={submit}
            disabled={loading}
            label={loading ? "Creating…" : "Create project"}
            className="h-11 w-full"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
