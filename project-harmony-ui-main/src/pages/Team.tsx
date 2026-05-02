import { useState } from "react";
import { Search, UserPlus, Shield, User as UserIcon, FolderKanban } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usersApi, projectsApi, type ApiUser, type ApiProject } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AddToProjectModal } from "@/components/common/AddToProjectModal";
import { toast } from "sonner";

export default function Team() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "Admin";

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersApi.list(search || undefined),
    enabled: isAdmin,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list({ limit: 100 }),
    enabled: isAdmin,
  });

  const users: ApiUser[] = usersData?.data.users ?? [];
  const projects: ApiProject[] = projectsData?.data.projects ?? [];

  const handleAddToProject = (u: ApiUser) => {
    setSelectedUser(u);
    setAddModalOpen(true);
  };

  const handleAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    toast.success(`${selectedUser?.name} added to project`);
  };

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Your team members across projects.</p>
        </div>
        <Card className="p-8 text-center shadow-elegant">
          <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Admin access required</p>
          <p className="mt-1 text-sm text-muted-foreground">Only Admins can manage team members.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            {isLoading ? "Loading…" : `${users.length} registered user${users.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="p-10 text-center shadow-elegant">
          <UserIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            {search ? "No users match your search." : "No users registered yet."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            // Find which projects this user is a member of
            const memberOfProjects = projects.filter((p) =>
              p.members?.some((m) => m._id === u._id)
            );

            return (
              <Card key={u._id} className="p-4 shadow-elegant border-border/60">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback className="bg-gradient-primary text-sm font-semibold text-primary-foreground">
                      {initials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{u.name}</p>
                      <Badge
                        variant={u.role === "Admin" ? "default" : "secondary"}
                        className="shrink-0 text-[10px] px-1.5 py-0"
                      >
                        {u.role}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>

                    {/* Projects this user belongs to */}
                    {memberOfProjects.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {memberOfProjects.slice(0, 2).map((p) => (
                          <span
                            key={p._id}
                            className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-foreground"
                          >
                            <FolderKanban className="h-2.5 w-2.5" />
                            {p.title}
                          </span>
                        ))}
                        {memberOfProjects.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{memberOfProjects.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Add to project button — skip if it's the current admin */}
                {u._id !== user?._id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full gap-1.5 text-xs"
                    onClick={() => handleAddToProject(u)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add to project
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {selectedUser && (
        <AddToProjectModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          user={selectedUser}
          projects={projects}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
