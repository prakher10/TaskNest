import { useState } from "react";
import { Search, UserPlus, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { usersApi, projectsApi, type ApiUser, type ApiProject } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project: ApiProject;
  onUpdated?: () => void;
}

export function InviteMemberModal({ open, onOpenChange, project, onUpdated }: Props) {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersApi.list(search || undefined),
    enabled: open,
  });

  const allUsers: ApiUser[] = data?.data.users ?? [];

  // Split into current members and non-members
  const currentMemberIds = new Set(project.members?.map((m) => m._id) ?? []);
  const nonMembers = allUsers.filter((u) => !currentMemberIds.has(u._id));
  const currentMembers = project.members ?? [];

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const addMember = async (userId: string, name: string) => {
    setAdding(userId);
    try {
      await projectsApi.addMembers(project._id, [userId]);
      toast.success(`${name} added to project`);
      onUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAdding(null);
    }
  };

  const removeMember = async (userId: string, name: string) => {
    setRemoving(userId);
    try {
      await projectsApi.removeMember(project._id, userId);
      toast.success(`${name} removed from project`);
      onUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage members</DialogTitle>
          <DialogDescription>Add or remove members from "{project.title}"</DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email…"
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-72">
          <div className="space-y-1 pr-2">
            {/* Current members */}
            {currentMembers.length > 0 && (
              <>
                <p className="px-1 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Current members ({currentMembers.length})
                </p>
                {currentMembers.map((m) => {
                  const isCreator = project.createdBy?._id === m._id;
                  return (
                    <div key={m._id} className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-primary text-[10px] font-semibold text-primary-foreground">
                          {initials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      </div>
                      {isCreator ? (
                        <span className="text-xs text-muted-foreground">Owner</span>
                      ) : (
                        <button
                          onClick={() => removeMember(m._id, m.name)}
                          disabled={removing === m._id}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Remove from project"
                        >
                          {removing === m._id ? (
                            <span className="text-xs">…</span>
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Users to add */}
            {nonMembers.length > 0 && (
              <>
                <p className="px-1 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">
                  Add people
                </p>
                {nonMembers.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent/50 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-primary text-[10px] font-semibold text-primary-foreground">
                        {initials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1 text-xs"
                      disabled={adding === u._id}
                      onClick={() => addMember(u._id, u.name)}
                    >
                      {adding === u._id ? (
                        "Adding…"
                      ) : (
                        <><UserPlus className="h-3.5 w-3.5" /> Add</>
                      )}
                    </Button>
                  </div>
                ))}
              </>
            )}

            {allUsers.length === 0 && search && (
              <p className="py-6 text-center text-sm text-muted-foreground">No users found for "{search}"</p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
