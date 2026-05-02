import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/data/mockData";

const styles: Record<TaskPriority, string> = {
  low: "bg-info/10 text-info border-info/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant="outline" className={cn("capitalize font-medium", styles[priority])}>
      {priority}
    </Badge>
  );
}
