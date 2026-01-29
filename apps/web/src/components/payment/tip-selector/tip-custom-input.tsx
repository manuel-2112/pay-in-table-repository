/**
 * Tip Custom Input Component
 * 
 * Presentational component for custom tip amount input.
 * Follows Single Responsibility Principle: only renders input UI.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TipCustomInputProps {
  /**
   * Current input value
   */
  value: string;
  /**
   * Change handler
   */
  onChange: (value: string) => void;
  /**
   * Calculated tip percentage (for display)
   */
  tipPercentage?: number;
  /**
   * Whether input is disabled
   */
  disabled?: boolean;
}

/**
 * TipCustomInput component
 * 
 * Input field for entering custom tip amount.
 * 
 * @example
 * ```tsx
 * <TipCustomInput
 *   value={customAmount}
 *   onChange={handleCustomAmountChange}
 *   tipPercentage={calculatedPercentage}
 * />
 * ```
 */
export function TipCustomInput({
  value,
  onChange,
  tipPercentage,
  disabled = false,
}: TipCustomInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="custom-tip" className="text-sm">
        O ingresa un monto personalizado
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <Input
          id="custom-tip"
          type="text"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="pl-7 h-12 text-lg"
          inputMode="numeric"
        />
      </div>
      {value && tipPercentage !== undefined && (
        <p className="text-xs text-muted-foreground">
          Aproximadamente {tipPercentage}% del total
        </p>
      )}
    </div>
  );
}
