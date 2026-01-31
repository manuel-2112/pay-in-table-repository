/**
 * Mobile Container Component
 * 
 * Container component optimized for mobile viewports (320px - 428px).
 * Follows Single Responsibility Principle: only handles mobile layout.
 */

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MobileContainerProps {
  children: ReactNode;
  /**
   * Maximum width variant
   * - sm: 320px (iPhone SE)
   * - md: 375px (iPhone standard)
   * - lg: 428px (iPhone Pro Max)
   */
  maxWidth?: "sm" | "md" | "lg";
  /**
   * Whether to apply default padding
   */
  padding?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MobileContainer component
 * 
 * Provides consistent mobile-first layout with max-width constraints.
 * 
 * @example
 * ```tsx
 * <MobileContainer maxWidth="md" padding>
 *   <YourContent />
 * </MobileContainer>
 * ```
 */
export function MobileContainer({
  children,
  maxWidth = "md",
  padding = true,
  className,
}: MobileContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidth === "sm" && "max-w-[320px]",
        maxWidth === "md" && "max-w-[375px]",
        maxWidth === "lg" && "max-w-[428px]",
        padding && "px-4 py-6",
        className
      )}
    >
      {children}
    </div>
  );
}
