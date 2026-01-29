/**
 * ItemSelectorContainer - Container for Split flow item selection
 *
 * Manages state for selected items and totals. Renders ItemSelectorList
 * and FloatingPaymentPanel. Presentational children receive all data via props.
 */

import { useState, useMemo, useCallback } from "react";
import { ItemSelectorList } from "./item-selector-list";
import type { SplitItem } from "./item-selector-row";
import { FloatingPaymentPanel } from "@/components/payment/checkout/floating-payment-panel";

export interface ItemSelectorContainerProps {
  /** Initial items (e.g. from bill) */
  initialItems: SplitItem[];
  /** Tax rate as decimal (e.g. 0.19 for 19% IVA) */
  taxRate?: number;
  /** Callback when user confirms: selected items and their total (subtotal + tax) */
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

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const selectedItems = useMemo(
    () => items.filter((item) => item.completed),
    [items]
  );

  const totals = useMemo(() => {
    const selectedSubtotal = selectedItems.reduce(
      (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1),
      0
    );
    const selectedTax = Math.round(selectedSubtotal * taxRate);
    return {
      selectedSubtotal,
      selectedTax,
      selectedTotal: selectedSubtotal + selectedTax,
      selectedCount: selectedItems.length,
    };
  }, [selectedItems, taxRate]);

  const handlePayNow = useCallback(() => {
    onPayNow?.(selectedItems, totals.selectedTotal);
  }, [onPayNow, selectedItems, totals.selectedTotal]);

  return (
    <>
      <ItemSelectorList items={items} onToggle={toggleItem} />
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
