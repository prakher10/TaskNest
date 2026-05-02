import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, LogOut, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { profileApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

function PasswordInput({ id, value, onChange, placeholder }: {
  id: string; value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setChangingPw(true);
    try {
      await profileApi.changePassword({ oldPassword, newPassword });
      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account security and preferences.</p>
      </div>

      {/* ── Change Password ── */}
      <Card className="p-6 shadow-elegant">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">Change password</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Use a strong password with at least 8 characters.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="old-pw">Current password</Label>
            <PasswordInput
              id="old-pw"
              value={oldPassword}
              onChange={setOldPassword}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <PasswordInput
              id="new-pw"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Confirm new password</Label>
            <PasswordInput
              id="confirm-pw"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repeat new password"
            />
          </div>

          {/* Password match indicator */}
          {newPassword && confirmPassword && (
            <p className={`text-xs ${newPassword === confirmPassword ? "text-green-600" : "text-destructive"}`}>
              {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}

          <AnimatedButton
            type="submit"
            disabled={changingPw || !oldPassword || !newPassword || !confirmPassword}
            label={changingPw ? "Updating…" : "Update password"}
            className="h-11 w-full"
          />
        </form>
      </Card>

      {/* ── Account ── */}
      <Card className="p-6 shadow-elegant">
        <h3 className="text-base font-semibold mb-1">Account</h3>
        <p className="text-sm text-muted-foreground mb-5">Manage your session.</p>

        <Separator className="mb-5" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Log out</p>
            <p className="text-xs text-muted-foreground">Sign out of your account on this device.</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </Card>
    </div>
  );
}
