export type TaskStatus = "pending" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: string;
  projectId: string;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string;
  membersCount: number;
  progress: number;
  members: Member[];
}

export const members: Member[] = [
  { id: "u1", name: "Alex Morgan", role: "Product Lead", initials: "AM" },
  { id: "u2", name: "Sarah Chen", role: "Designer", initials: "SC" },
  { id: "u3", name: "James Patel", role: "Frontend Dev", initials: "JP" },
  { id: "u4", name: "Emily Rivera", role: "QA Engineer", initials: "ER" },
  { id: "u5", name: "Daniel Kim", role: "Backend Dev", initials: "DK" },
];

export const projects: Project[] = [
  {
    id: "p1",
    title: "Website Redesign",
    description: "Refresh marketing site with new brand guidelines and improved UX.",
    color: "from-indigo-500 to-purple-500",
    membersCount: 5,
    progress: 64,
    members,
  },
  {
    id: "p2",
    title: "Mobile App Launch",
    description: "Ship iOS & Android v1 with onboarding flow and analytics.",
    color: "from-pink-500 to-rose-500",
    membersCount: 4,
    progress: 38,
    members: members.slice(0, 4),
  },
  {
    id: "p3",
    title: "Q3 Marketing Campaign",
    description: "Plan and execute multi-channel campaign for product launch.",
    color: "from-amber-500 to-orange-500",
    membersCount: 3,
    progress: 82,
    members: members.slice(1, 4),
  },
  {
    id: "p4",
    title: "Internal Dashboard",
    description: "Build internal analytics dashboard for ops team.",
    color: "from-emerald-500 to-teal-500",
    membersCount: 4,
    progress: 25,
    members: members.slice(0, 4),
  },
  {
    id: "p5",
    title: "API Migration",
    description: "Migrate legacy endpoints to v2 with backward compatibility.",
    color: "from-sky-500 to-blue-500",
    membersCount: 3,
    progress: 50,
    members: members.slice(2, 5),
  },
  {
    id: "p6",
    title: "Customer Onboarding",
    description: "Improve activation funnel and self-serve onboarding.",
    color: "from-fuchsia-500 to-pink-500",
    membersCount: 5,
    progress: 12,
    members,
  },
];

export const tasks: Task[] = [
  { id: "t1", title: "Design new landing hero", status: "in-progress", priority: "high", dueDate: "2026-05-08", assignee: "SC", projectId: "p1", description: "Update the hero section with new copy and illustration." },
  { id: "t2", title: "Set up component library", status: "completed", priority: "medium", dueDate: "2026-04-28", assignee: "JP", projectId: "p1" },
  { id: "t3", title: "Write blog post draft", status: "pending", priority: "low", dueDate: "2026-05-15", assignee: "AM", projectId: "p1" },
  { id: "t4", title: "QA cross-browser tests", status: "pending", priority: "medium", dueDate: "2026-05-12", assignee: "ER", projectId: "p1" },
  { id: "t5", title: "Onboarding flow wireframes", status: "in-progress", priority: "high", dueDate: "2026-05-04", assignee: "SC", projectId: "p2" },
  { id: "t6", title: "Push notifications integration", status: "pending", priority: "high", dueDate: "2026-04-30", assignee: "DK", projectId: "p2" },
  { id: "t7", title: "App icon final assets", status: "completed", priority: "low", dueDate: "2026-04-20", assignee: "SC", projectId: "p2" },
  { id: "t8", title: "Email sequence copy", status: "in-progress", priority: "medium", dueDate: "2026-05-10", assignee: "AM", projectId: "p3" },
  { id: "t9", title: "Social media assets", status: "pending", priority: "medium", dueDate: "2026-05-18", assignee: "SC", projectId: "p3" },
  { id: "t10", title: "Schema migration script", status: "pending", priority: "high", dueDate: "2026-04-29", assignee: "DK", projectId: "p5" },
  { id: "t11", title: "Dashboard chart components", status: "in-progress", priority: "medium", dueDate: "2026-05-20", assignee: "JP", projectId: "p4" },
  { id: "t12", title: "Deprecation notice email", status: "completed", priority: "low", dueDate: "2026-04-25", assignee: "AM", projectId: "p5" },
];

export const stats = {
  total: tasks.length,
  completed: tasks.filter((t) => t.status === "completed").length,
  pending: tasks.filter((t) => t.status === "pending").length,
  overdue: tasks.filter((t) => t.status !== "completed" && new Date(t.dueDate) < new Date("2026-05-02")).length,
};
