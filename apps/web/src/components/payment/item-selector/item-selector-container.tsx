/**
 * ItemSelectorContainer - Container for Split flow item selection
 *
 * Manages state for selected quantities per product. Renders ItemSelectorList
 * and FloatingPaymentPanel. Uses new API: selectedByMe, maxSelectable, onIncrement/onDecrement.
 */

import { useState, useMemo, useCallback } from "react";
import { ItemSelectorList } from "./item-selector-list";
import type { SplitItem } from "./item-selector-row";
import { FloatingPaymentPanel } from "@/components/payment/checkout/floating-payment-panel";

export interface ItemSelectorContainerProps {
  /** Initial items in new shape (id, text, price, selectedByMe, maxSelectable, disabled) */
  initialItems: SplitItem[];
  /** Tax rate as decimal (e.g. 0.19 for 19% IVA) */
  taxRate?: number;
  /** Callback when user confirms: selected items (with selectedByMe > 0) and total (subtotal + tax) */
  onPayNow?: (selectedItems: SplitItem[], total: number) => void;
  /** Label for the floating panel button */
  label?: string;
}

export function ItemSelectorContainer({
  initialItems,
  taxRate = 0.19,
  onPayNow,
  label = "Continuar",
}: ItemSelectorContainerProps) {
  const [items, setItems] = useState<SplitItem[]>(initialItems);

  const onIncrement = useCallback((groupKey: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === groupKey && item.selectedByMe < item.maxSelectable
          ? { ...item, selectedByMe: item.selectedByMe + 1 }
          : item
      )
    );
  }, []);

  const onDecrement = useCallback((groupKey: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === groupKey && item.selectedByMe > 0
          ? { ...item, selectedByMe: item.selectedByMe - 1 }
          : item
      )
    );
  }, []);

  const selectedItems = useMemo(
    () => items.filter((item) => item.selectedByMe > 0),
    [items]
  );

  const totals = useMemo(() => {
    const selectedSubtotal = items.reduce(
      (sum, item) => sum + item.price * item.selectedByMe,
      0
    );
    const selectedTax = Math.round(selectedSubtotal * taxRate);
    const selectedCount = items.reduce((sum, item) => sum + item.selectedByMe, 0);
    return {
      selectedSubtotal,
      selectedTax,
      selectedTotal: selectedSubtotal + selectedTax,
      selectedCount,
    };
  }, [items, taxRate]);

  const handlePayNow = useCallback(() => {
    onPayNow?.(selectedItems, totals.selectedTotal);
  }, [onPayNow, selectedItems, totals.selectedTotal]);

  return (
    <>
      <ItemSelectorList
        items={items}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />
      <FloatingPaymentPanel
        selectedCount={totals.selectedCount}
        subtotal={totals.selectedSubtotal}
        tax={totals.selectedTax}
        total={totals.selectedTotal}
        onPayNow={totals.selectedCount > 0 ? handlePayNow : undefined}
        label={label}
      />
    </>
  );
}
