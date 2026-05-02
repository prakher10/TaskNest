import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  className?: string;
}

/**
 * AnimatedButton — letter-by-letter slide animation on hover.
 * On hover: current letters slide up and out, new letters slide in from below.
 */
export function AnimatedButton({ label, className, ...props }: AnimatedButtonProps) {
  const letters = label.split("");

  return (
    <button
      {...props}
      className={cn(
        "animated-btn relative overflow-hidden",
        className
      )}
    >
      {/* First row — slides up on hover */}
      <span className="span-mother" aria-hidden="true">
        {letters.map((char, i) => (
          <span key={i} style={{ transitionDelay: `${0.1 + i * 0.05}s` }}>
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      {/* Second row — slides in from below on hover */}
      <span className="span-mother2" aria-hidden="true">
        {letters.map((char, i) => (
          <span key={i} style={{ transitionDelay: `${0.1 + i * 0.05}s` }}>
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      {/* Accessible label */}
      <span className="sr-only">{label}</span>
    </button>
  );
}
