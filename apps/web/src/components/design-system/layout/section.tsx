/**
 * Section Component
 * 
 * Reusable section wrapper with consistent spacing.
 * Follows Single Responsibility Principle: only handles section layout.
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  /**
   * Spacing variant
   */
  spacing?: "sm" | "md" | "lg" | "xl";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Section component
 * 
 * Provides consistent spacing between sections.
 * 
 * @example
 * ```tsx
 * <Section spacing="lg">
 *   <YourContent />
 * </Section>
 * ```
 */
export function Section({
  children,
  spacing = "md",
  className,
}: SectionProps) {
  return (
    <section
      className={cn(
        spacing === "sm" && "space-y-2",
        spacing === "md" && "space-y-4",
        spacing === "lg" && "space-y-6",
        spacing === "xl" && "space-y-8",
        className
      )}
    >
      {children}
    </section>
  );
}
