import { ReactNode, useState, useEffect } from "react";
import logo from "@/assets/tasknest-logo.png";
import dashboardImg from "@/assets/slides/dashboard.png";
import projectsImg from "@/assets/slides/projects.png";
import tasksImg from "@/assets/slides/tasks.png";
import teamImg from "@/assets/slides/team.png";

const slides = [
  { img: dashboardImg, title: "Interactive Dashboard" },
  { img: projectsImg, title: "Project Management" },
  { img: tasksImg, title: "Kanban Task Board" },
  { img: teamImg, title: "Team Collaboration" },
];

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:flex lg:flex-col lg:p-12 lg:text-primary-foreground">
        <div className="flex items-center gap-2 mb-16 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1 shadow-elegant">
            <img src={logo} alt="TaskNest" className="h-full w-full object-contain" />
          </div>
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Pacifico, cursive' }}>TaskNest</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-bold leading-[1.1] tracking-tight">
            Plan smarter.<br />
            <span className="text-white/60">Ship faster.</span>
          </h2>
          <p className="max-w-md text-lg text-white/80 leading-relaxed">
            The modern project workspace where teams move from idea to launch — without the chaos.
          </p>
        </div>

        {/* Dashboard Mockup Slideshow */}
        <div className="mt-12 relative flex-1 flex items-center justify-center z-10">
          <div className="animate-floating relative w-full max-w-[600px] aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 shadow-2xl glass-morphism">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              >
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="h-full w-full object-cover"
                />
                {/* Caption overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-3 text-sm font-medium text-white/90">
                  {slide.title}
                </div>
              </div>
            ))}
          </div>
          
          {/* Progress indicators */}
          <div className="absolute bottom-8 flex gap-2">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Decorative Blobs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-border">
              <img src={logo} alt="TaskNest" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-semibold" style={{ fontFamily: 'Pacifico, cursive' }}>TaskNest</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
