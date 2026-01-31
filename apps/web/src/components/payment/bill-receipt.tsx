/**
 * BillReceipt Component
 * 
 * Presentational component for displaying a restaurant bill/receipt.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { type HTMLAttributes } from "react";
import { cn, formatCLP } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface BillReceiptProps extends HTMLAttributes<HTMLDivElement> {
  restaurantName: string;
  address?: string;
  phone?: string;
  tableNumber: number;
  serverName: string;
  date: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    /** When true, row is shown in gray (e.g. reserved by another user or paid) */
    disabled?: boolean;
  }>;
  subtotal: number;
  tax: number;
  taxPercentage?: number;
  total: number;
}

export function BillReceipt({
  restaurantName,
  address,
  phone,
  tableNumber,
  serverName,
  date,
  orderNumber,
  items,
  subtotal,
  tax,
  taxPercentage = 8.5,
  total,
  className,
  ...props
}: BillReceiptProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[340px] overflow-hidden rounded-3xl bg-white text-zinc-900 shadow-xl",
        className
      )}
      {...props}
    >
      {/* Receipt Header */}
      <div className="bg-zinc-50 p-6 pb-4 text-center">
        <h2 className="text-xl font-bold tracking-tight">{restaurantName}</h2>
        {address && (
          <p className="mt-1 text-xs text-zinc-500">{address}</p>
        )}
        {phone && (
          <p className="text-xs text-zinc-500">{phone}</p>
        )}
      </div>

      {/* Dashed Separator */}
      <div className="relative h-4 bg-zinc-50">
        <div className="absolute inset-x-0 bottom-0 border-b-2 border-dashed border-zinc-200" />
      </div>

      {/* Receipt Body */}
      <div className="bg-white p-6 pt-4">
        {/* Info Grid */}
        <div className="mb-6 grid grid-cols-2 gap-y-2 text-xs text-zinc-500">
          <div>
            <span className="block font-medium text-zinc-900">Table: {tableNumber}</span>
            <span>Server: {serverName}</span>
          </div>
          <div className="text-right">
            <span className="block font-medium text-zinc-900">Date: {date}</span>
            <span>Order #: {orderNumber}</span>
          </div>
        </div>

        {/* Items Header */}
        <div className="mb-2 grid grid-cols-12 text-xs font-semibold text-zinc-900">
          <div className="col-span-6">Item</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-4 text-right">Price</div>
        </div>

        <Separator className="mb-4" />

        {/* Items List */}
        <div className="mb-6 space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                "grid grid-cols-12 text-sm",
                item.disabled
                  ? "text-zinc-400 dark:text-zinc-500"
                  : "text-zinc-600"
              )}
            >
              <div
                className={cn(
                  "col-span-6 font-medium",
                  item.disabled ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-900"
                )}
              >
                {item.name}
              </div>
              <div className="col-span-2 text-center">{item.quantity}</div>
              <div className="col-span-4 text-right">
                {formatCLP(item.price)}
              </div>
            </div>
          ))}
        </div>

        <Separator className="mb-4" />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span>{formatCLP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>{tax === 0 ? "IVA incluido" : `Tax (${taxPercentage}%)`}</span>
            <span>{formatCLP(tax)}</span>
          </div>
          
          <div className="mt-4 flex justify-between text-lg font-bold text-zinc-900">
            <span>Total</span>
            <span>{formatCLP(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-400">
            Thank you for dining with us!
          </p>
        </div>
      </div>
    </div>
  );
}
