import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  variant?: "primary" | "success" | "warning" | "destructive";
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  primary: "bg-accent text-accent-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({ label, value, icon: Icon, trend, variant = "primary" }: StatCardProps) {
  return (
    <Card className="flex items-center justify-between gap-4 border-border/60 p-5 shadow-elegant transition-all hover:-translate-y-0.5 hover:shadow-elegant-lg">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </div>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", variantStyles[variant])}>
        <Icon className="h-6 w-6" />
      </div>
    </Card>
  );
}
