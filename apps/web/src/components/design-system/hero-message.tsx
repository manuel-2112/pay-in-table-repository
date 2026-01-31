/**
 * HeroMessage Component
 *
 * Modular hero-style message component for thank you messages or CTAs.
 */

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface HeroMessageProps {
  /** Main message text */
  message: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Text size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes */
  className?: string;
  /** Whether to animate on mount */
  animate?: boolean;
  /** Animation delay in seconds */
  delay?: number;
}

export function HeroMessage({
  message,
  subtitle,
  size = "lg",
  className,
  animate = true,
  delay = 0,
}: HeroMessageProps) {
  const sizeClasses = {
    xs: "text-lg md:text-xl",
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl lg:text-6xl",
    xl: "text-5xl md:text-6xl lg:text-7xl",
  };

  const content = (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <h2
        className={cn(
          "font-bold leading-tight text-zinc-900 dark:text-white",
          sizeClasses[size]
        )}
      >
        {message}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-zinc-600 dark:text-zinc-400">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
