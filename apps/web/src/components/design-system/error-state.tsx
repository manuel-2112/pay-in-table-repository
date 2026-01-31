/**
 * Error State Component
 * 
 * Reusable error display component.
 * Follows Single Responsibility Principle: only displays errors.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /**
   * Error message to display
   */
  message: string;
  /**
   * Optional retry callback
   */
  onRetry?: () => void;
  /**
   * Optional title (defaults to "Error")
   */
  title?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ErrorState component
 * 
 * Displays error message with optional retry button.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   message="Error al cargar la cuenta"
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function ErrorState({
  message,
  onRetry,
  title = "Error",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center",
        className
      )}
    >
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Intentar nuevamente
        </Button>
      )}
    </div>
  );
}
