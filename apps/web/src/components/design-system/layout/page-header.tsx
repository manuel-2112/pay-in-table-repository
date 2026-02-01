/**
 * Page Header Component
 * 
 * Reusable page header for mobile views.
 * Follows Single Responsibility Principle: only renders header UI.
 * Adapted for TanStack Router.
 */

import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  /**
   * Main title
   */
  title: string;
  /**
   * Optional subtitle
   */
  subtitle?: string;
  /**
   * Optional back link URL (TanStack Router path)
   */
  backHref?: string;
  /**
   * Optional back handler function (overrides backHref if provided)
   */
  onBack?: () => void;
  /**
   * Optional action button (right side)
   */
  action?: ReactNode;
  /**
   * Optional: Hide back button even if onBack or backHref is provided
   */
  hideBack?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * PageHeader component
 * 
 * Reusable header with sticky positioning, backdrop blur, and navigation.
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Split the Bill"
 *   subtitle="Table 1"
 *   backHref="/"
 * />
 * ```
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  action,
  hideBack,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80",
        className
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
        {/* Back Button */}
        {(onBack || backHref) && !hideBack && (
          <div className="-ml-1">
            {onBack ? (
              <button
                onClick={onBack}
                type="button"
                className="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Go back"
              >
                <ArrowLeft className="size-4 text-zinc-600 dark:text-zinc-400" />
              </button>
            ) : (
              <Link
                to={backHref!}
                className="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Go back"
              >
                <ArrowLeft className="size-4 text-zinc-600 dark:text-zinc-400" />
              </Link>
            )}
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-zinc-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Button */}
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
