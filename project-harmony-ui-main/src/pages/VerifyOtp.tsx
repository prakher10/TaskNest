import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { AnimatedButton } from "@/components/ui/AnimatedButton";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp } = useAuth();

  // Email passed from signup page
  const email: string = (location.state as { email?: string })?.email ?? "";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const otp = digits.join("");

  const handleChange = (index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    // Auto-advance
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      toast.success("Email verified! Welcome to TaskNest 🎉");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
      // Clear digits on wrong code
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const res = await authApi.resendOtp({ email });
      if (res.data?.devOtp) {
        toast.info(`Dev mode — OTP: ${res.data.devOtp}`, { duration: 15000 });
      } else {
        toast.success("New code sent to your email");
      }
      setCountdown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${email}`}
    >
      <form onSubmit={submit} className="space-y-6">
        {/* OTP digit inputs */}
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
              className="h-14 w-12 text-center text-2xl font-bold tracking-widest"
              autoFocus={i === 0}
            />
          ))}
        </div>

        <AnimatedButton
          type="submit"
          disabled={loading || otp.length < 6}
          label={loading ? "Verifying…" : "Verify email"}
          className="h-11 w-full"
        />

        <div className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          {countdown > 0 ? (
            <span className="text-muted-foreground">Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Wrong email?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="font-medium text-primary hover:underline"
          >
            Go back
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
