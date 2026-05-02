import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Shield } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Member" });
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res: any = await signup(form.name, form.email, form.password, form.role);
      
      if (res?.data?.devOtp) {
        toast.info(`Dev mode — OTP: ${res.data.devOtp}`, { duration: 15000 });
      } else {
        toast.success("Verification code sent to your email!");
      }
      
      // Pass email to the OTP page via state
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start organizing your team's work in minutes.">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" placeholder="Jane Cooper" value={form.name} onChange={update("name")} className="h-11 pl-9" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@company.com" value={form.email} onChange={update("email")} className="h-11 pl-9" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" placeholder="At least 8 characters" value={form.password} onChange={update("password")} className="h-11 pl-9" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <div className="relative">
            <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="h-11 pl-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin — can create projects &amp; tasks</SelectItem>
                <SelectItem value="Member">Member — works on assigned tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <AnimatedButton
          type="submit"
          disabled={loading}
          label={loading ? "Sending code…" : "Continue"}
          className="h-11 w-full"
        />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
