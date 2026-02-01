/**
 * ItemSelectorList - Presentational list of items with quantity selector
 *
 * Renders a list of ItemSelectorRow (one per product, with +/−).
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ItemSelectorRow, type SplitItem } from "./item-selector-row";

interface ItemSelectorListProps {
  items: SplitItem[];
  onIncrement: (groupKey: string) => void;
  onDecrement: (groupKey: string) => void;
  className?: string;
}

export function ItemSelectorList({
  items,
  onIncrement,
  onDecrement,
  className,
}: ItemSelectorListProps) {
  return (
    <div className={cn("space-y-0.5 py-1", className)}>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <ItemSelectorRow
            key={item.id}
            item={item}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
