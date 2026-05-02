import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail, Shield, Calendar, CheckCircle2, Clock,
  ListTodo, Pencil, X, Check, Camera, Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { profileApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

export default function Profile() {
  const { user: authUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get(),
  });

  const profile = data?.data.user;
  const stats = data?.data.stats;

  // Edit name/email
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const startEdit = () => {
    setName(profile?.name ?? "");
    setEmail(profile?.email ?? "");
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await profileApi.update({ name, email });
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      refreshUser();
      setEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Convert selected file → base64 → upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Compress image to max 400×400 and quality 0.7 before uploading
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.7);

      setAvatarUploading(true);
      try {
        await profileApi.update({ avatar: base64 });
        toast.success("Profile picture updated");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        refreshUser();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to upload picture");
      } finally {
        setAvatarUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    img.src = objectUrl;
  };

  const removeAvatar = async () => {
    setAvatarUploading(true);
    try {
      await profileApi.update({ avatar: null });
      toast.success("Profile picture removed");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      refreshUser();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove picture");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your personal information and stats.</p>
      </div>

      {/* ── Avatar + Basic Info ── */}
      <Card className="p-6 shadow-elegant">
        <div className="flex items-start gap-5">

          {/* Avatar with upload overlay */}
          <div className="relative shrink-0 group/avatar">
            <Avatar className="h-20 w-20">
              {profile?.avatar && <AvatarImage src={profile.avatar} alt={profile.name} className="object-cover" />}
              <AvatarFallback className="bg-gradient-primary text-2xl font-bold text-primary-foreground">
                {avatarUploading ? "…" : initials}
              </AvatarFallback>
            </Avatar>

            {/* Camera overlay — click to upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity disabled:cursor-not-allowed"
              title="Change profile picture"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>

            {/* Remove button — only shown when avatar exists */}
            {profile?.avatar && !avatarUploading && (
              <button
                onClick={removeAvatar}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                title="Remove picture"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name / email / role */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="p-name">Full name</Label>
                  <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p-email">Email</Label>
                  <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" />
                </div>
                <div className="flex gap-2">
                  <AnimatedButton
                    onClick={saveProfile}
                    disabled={saving}
                    label={saving ? "Saving…" : "Save changes"}
                    className="h-11 px-8"
                  />
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold">{profile?.name}</h2>
                  <Badge variant={profile?.role === "Admin" ? "default" : "secondary"}>
                    {profile?.role}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>{profile?.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined{" "}
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Edit profile
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Upload hint */}
        <p className="mt-4 text-xs text-muted-foreground">
          Hover over your avatar to change or remove your profile picture (max 2 MB).
        </p>
      </Card>

      {/* ── Personal Stats ── */}
      <Card className="p-6 shadow-elegant">
        <h3 className="mb-4 text-base font-semibold">Task statistics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary p-4 text-center">
            <ListTodo className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold">{stats?.totalTasks ?? 0}</span>
            <span className="text-xs text-muted-foreground">Total assigned</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold">{stats?.completedTasks ?? 0}</span>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-2xl font-bold">{stats?.pendingTasks ?? 0}</span>
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
