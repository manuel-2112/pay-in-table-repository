/**
 * RestaurantLogo Component
 *
 * Modular component for displaying restaurant logo.
 * Uses a fixed standard size; image scales to fit inside without losing aspect ratio.
 */

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Tamaño estándar del logo (px) – contenedor fijo para consistencia visual */
const STANDARD_LOGO_SIZE = 240;

export interface RestaurantLogoProps {
  /** Logo image source (URL or path) */
  src?: string;
  /** Alt text for the logo */
  alt?: string;
  /** Restaurant name (fallback if no image) */
  name?: string;
  /** Tamaño del contenedor en px (default: 240). La imagen escala dentro sin deformarse */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show animation on mount */
  animate?: boolean;
}

export function RestaurantLogo({
  src,
  alt,
  name,
  size = STANDARD_LOGO_SIZE,
  className,
  animate = true,
}: RestaurantLogoProps) {
  const containerStyle = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
  };

  const content = src ? (
    <div
      className={cn("flex items-center justify-center", className)}
      style={containerStyle}
    >
      <img
        src={src}
        alt={alt ?? name ?? "Restaurant logo"}
        className="h-full w-full object-contain"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  ) : name ? (
    <div
      className={cn(
        "flex items-center justify-center text-center font-bold text-zinc-900 dark:text-white",
        className
      )}
      style={containerStyle}
    >
      {name}
    </div>
  ) : null;

  if (!content) return null;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-center"
      >
        {content}
      </motion.div>
    );
  }

  return <div className="flex items-center justify-center">{content}</div>;
}
