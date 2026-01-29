/**
 * WavyStrikethrough - Animated wavy strikethrough SVG
 *
 * Renders an animated wavy line that appears/disappears with a drawing effect.
 * Position this absolutely over the text you want to strike through.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <span>Item text</span>
 *   <WavyStrikethrough isVisible={isCompleted} />
 * </div>
 * ```
 */

import { motion } from "motion/react";

interface WavyStrikethroughProps {
  /** Whether the strikethrough is visible */
  isVisible: boolean;
  /** Optional custom color class */
  colorClass?: string;
}

export function WavyStrikethrough({
  isVisible,
  colorClass = "text-[var(--brand-primary)]",
}: WavyStrikethroughProps) {
  return (
    <motion.svg
      className={`pointer-events-none absolute left-0 top-1/2 h-3 w-full -translate-y-1/2 ${colorClass}`}
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: isVisible ? 1 : 0,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.path
        d="M0 5 Q 5 0, 10 5 T 20 5 T 30 5 T 40 5 T 50 5 T 60 5 T 70 5 T 80 5 T 90 5 T 100 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isVisible ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
