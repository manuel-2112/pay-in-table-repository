/**
 * Tip Selector View Component
 * 
 * Presentational component for tip selection UI.
 * Follows Single Responsibility Principle: only renders tip selector UI.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { TipPresetButton } from "./tip-preset-button";
import { TipCustomInput } from "./tip-custom-input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TIP_PRESETS } from "@/lib/constants/payment";
import Counter from "@/components/ui/counter";

interface TipSelectorViewProps {
  /**
   * Subtotal amount (for percentage calculations)
   */
  subtotal: number;
  /**
   * Current tip amount
   */
  currentTip: number;
  /**
   * Selected preset percentage (null if custom)
   */
  selectedPreset: number | null;
  /**
   * Custom tip amount input value
   */
  customAmount: string;
  /**
   * Handler for preset selection
   */
  onPresetSelect: (percentage: number) => void;
  /**
   * Handler for custom amount change
   */
  onCustomAmountChange: (value: string) => void;
  /**
   * Whether selector is disabled
   */
  disabled?: boolean;
}

/**
 * TipSelectorView component
 * 
 * Displays tip selection UI with presets and custom input.
 * 
 * @example
 * ```tsx
 * <TipSelectorView
 *   subtotal={27500}
 *   currentTip={4125}
 *   selectedPreset={15}
 *   customAmount=""
 *   onPresetSelect={handlePresetClick}
 *   onCustomAmountChange={handleCustomChange}
 * />
 * ```
 */
export function TipSelectorView({
  subtotal,
  currentTip,
  selectedPreset,
  customAmount,
  onPresetSelect,
  onCustomAmountChange,
  disabled = false,
}: TipSelectorViewProps) {
  const tipPercentage =
    subtotal > 0 ? Math.round((currentTip / subtotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Propina</Label>
        <p className="text-sm text-muted-foreground">
          ¿Deseas agregar una propina?
        </p>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {TIP_PRESETS.map((percentage) => (
          <TipPresetButton
            key={percentage}
            percentage={percentage}
            isSelected={selectedPreset === percentage}
            onClick={() => onPresetSelect(percentage)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Custom amount input */}
      <TipCustomInput
        value={customAmount}
        onChange={onCustomAmountChange}
        tipPercentage={tipPercentage}
        disabled={disabled}
      />

      {/* Current tip display */}
      <Card className="bg-muted/50 p-6 flex flex-col items-center justify-center gap-2 overflow-hidden relative min-h-[160px]">
        <p className="text-sm text-muted-foreground z-10 relative">
          Propina seleccionada
        </p>
        <div className="flex items-center justify-center z-10 relative">
          <span className="text-4xl font-bold text-[var(--foreground)] mr-2">
            $
          </span>
          <Counter
            value={currentTip}
            fontSize={48}
            padding={0}
            gap={2}
            textColor="var(--foreground)"
            fontWeight={700}
            gradientFrom="var(--background)"
            gradientTo="transparent"
            gradientHeight={32}
          />
        </div>
      </Card>
    </div>
  );
}
