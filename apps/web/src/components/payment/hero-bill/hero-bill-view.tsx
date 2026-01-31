/**
 * HeroBillView Component
 * 
 * Presentational component for displaying the bill in a hero section.
 * Features animated scroll effects and bill receipt display.
 * Modular layout with sticky banner, logo, hero message, and receipt.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Users } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { CustomButton } from "@/components/design-system/ui/custom-button";
import { StickyBanner } from "@/components/ui/sticky-banner";
import { RestaurantLogo } from "@/components/design-system/restaurant-logo";
import { HeroMessage } from "@/components/design-system/hero-message";
import { BillReceipt } from "../bill-receipt";

interface HeroBillViewProps {
  restaurantName: string;
  establishmentYear: string;
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
    /** When true, item is shown in gray (e.g. reserved by another user or paid) */
    disabled?: boolean;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  onPay?: () => void;
  onSplit?: () => void;
  showActions?: boolean;
  /** Optional logo image URL */
  logoUrl?: string;
  /** Thank you message (default: "¡Gracias por elegirnos!") */
  thankYouMessage?: string;
}

export function HeroBillView({
  restaurantName,
  establishmentYear: _establishmentYear,
  address,
  phone,
  tableNumber,
  serverName,
  date,
  orderNumber,
  items,
  subtotal,
  tax,
  total,
  onPay,
  onSplit,
  showActions = true,
  logoUrl,
  thankYouMessage = "¡Gracias por elegirnos!",
}: HeroBillViewProps) {
  // Simple text flip component for the payment mode indicator
  const SimpleTextFlip = ({
    words,
    duration,
  }: {
    words: string[];
    duration: number;
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
      }, duration);

      return () => clearInterval(interval);
    }, [words.length, duration]);

    return (
      <motion.span
        layout
        className="relative w-fit overflow-hidden rounded-md border border-zinc-200 bg-white px-2 py-1 font-sans text-sm font-medium tracking-tight text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -40, filter: "blur(10px)" }}
            animate={{
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{ y: 50, filter: "blur(10px)", opacity: 0 }}
            transition={{
              duration: 0.5,
            }}
            className="inline-block whitespace-nowrap"
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white dark:bg-zinc-950">
      {/* Sticky Banner - Powered by AgoraPay */}
      <StickyBanner
        hideOnScroll
        className="bg-gradient-to-b from-zinc-900 to-zinc-800 dark:from-zinc-950 dark:to-zinc-900"
      >
        <p className="mx-0 text-xs font-medium text-white drop-shadow-md">
          powered by{" "}
          <span className="font-semibold">AgoraPay</span>
        </p>
      </StickyBanner>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center gap-8 px-4 py-12">
              {/* Payment Mode Indicator */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm font-medium tracking-tight text-zinc-600 dark:text-zinc-400">
                  Paga
                </span>
                <SimpleTextFlip
                  words={["Simple", "Fácil", "Rápido", "Seguro"]}
                  duration={2500}
                />
              </motion.div>

              {/* Restaurant Logo - tamaño estándar, proporcional */}
              <RestaurantLogo
                src={logoUrl}
                alt={`${restaurantName} logo`}
                name={restaurantName}
                className="mx-auto"
              />
            </div>
          }
        >
          <BillReceipt
            restaurantName={restaurantName}
            address={address}
            phone={phone}
            tableNumber={tableNumber}
            serverName={serverName}
            date={date}
            orderNumber={orderNumber}
            items={items}
            subtotal={subtotal}
            tax={tax}
            taxPercentage={8.5}
            total={total}
          />
        </ContainerScroll>

        {/* Mensaje de agradecimiento debajo de la cuenta (fuera del Card para que se vea al hacer scroll) */}
        <div className="px-4 pt-12 pb-32 text-center">
          <HeroMessage
            message={thankYouMessage}
            size="xs"
            className="text-zinc-600 dark:text-zinc-400"
            delay={0}
          />
        </div>
      </div>

      {/* Action Buttons - Pagar Cuenta / Dividir */}
      {showActions && (
        <div className="fixed bottom-6 left-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 gap-3 px-4">
          {onPay && (
            <CustomButton
              onClick={onPay}
              className="flex flex-1 items-center justify-center gap-2"
              aria-label="Pagar cuenta"
            >
              <CreditCard className="size-4 shrink-0" aria-hidden />
              Pagar Cuenta
            </CustomButton>
          )}
          {onSplit && (
            <CustomButton
              onClick={onSplit}
              color="#ea580c"
              className="flex flex-1 items-center justify-center gap-2"
              aria-label="Dividir cuenta"
            >
              <Users className="size-4 shrink-0" aria-hidden />
              Dividir
            </CustomButton>
          )}
        </div>
      )}
    </div>
  );
}
