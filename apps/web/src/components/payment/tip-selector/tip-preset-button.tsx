/**
 * Tip Preset Button Component
 * 
 * Presentational component for tip preset buttons (0%, 10%, 15%, 20%).
 * Follows Single Responsibility Principle: only renders button UI.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { CustomButton } from "@/components/design-system/ui/custom-button";
import { cn } from "@/lib/utils";

interface TipPresetButtonProps {
  /**
   * Tip percentage (0, 10, 15, 20)
   */
  percentage: number;
  /**
   * Whether this preset is currently selected
   */
  isSelected: boolean;
  /**
   * Click handler
   */
  onClick: () => void;
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
}

/**
 * TipPresetButton component
 * 
 * Displays a tip preset button with percentage.
 * 
 * @example
 * ```tsx
 * <TipPresetButton
 *   percentage={15}
 *   isSelected={selectedPreset === 15}
 *   onClick={() => handlePresetClick(15)}
 * />
 * ```
 */
export function TipPresetButton({
  percentage,
  isSelected,
  onClick,
  disabled = false,
}: TipPresetButtonProps) {
  const label = percentage === 0 ? "Sin propina" : `${percentage}%`;

  return (
    <CustomButton
      type="button"
      variant="default"
      color={isSelected ? undefined : "var(--muted)"}
      textColor={isSelected ? undefined : "var(--muted-foreground)"}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-12 font-medium flex-1 min-w-[80px] max-w-[120px]"
      )}
    >
      {label}
    </CustomButton>
  );
}
