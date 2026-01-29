/**
 * HeroBillView Component
 * 
 * Presentational component for displaying the bill in a hero section.
 * Features animated scroll effects and bill receipt display.
 * Dummy component - receives all data via props, no internal state/logic.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Users } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { CustomButton } from "@/components/design-system/ui/custom-button";
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
  }>;
  subtotal: number;
  tax: number;
  total: number;
  onPay?: () => void;
  onSplit?: () => void;
  showActions?: boolean;
}

export function HeroBillView({
  restaurantName,
  establishmentYear,
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
}: HeroBillViewProps) {
  // Split restaurant name into words for animation
  const restaurantNameWords = restaurantName.split(" ");

  // Simple text flip component for the subtitle
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
        className="relative w-fit overflow-hidden rounded-md border border-transparent bg-white px-2 py-1 font-sans text-base font-medium tracking-tight text-zinc-900 shadow-sm ring shadow-black/5 ring-black/5 md:text-lg dark:bg-zinc-800 dark:text-white dark:shadow-sm dark:ring-1 dark:shadow-white/5 dark:ring-white/10"
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
    <div className="flex flex-col overflow-hidden relative">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-2 flex items-center gap-2"
            >
              <div className="size-6 md:size-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600" />
              <span className="text-xs md:text-sm font-medium tracking-widest uppercase text-amber-600 dark:text-amber-400">
                Est. {establishmentYear}
              </span>
            </motion.div>
            <h1 className="text-center">
              {restaurantNameWords.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.15,
                    ease: "easeInOut",
                  }}
                  className="mr-2 md:mr-4 inline-block text-3xl md:text-[5rem] font-bold leading-none text-zinc-900 dark:text-white"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="mt-2 flex items-center justify-center gap-2"
            >
              <span className="text-base font-medium tracking-tight text-zinc-600 md:text-lg dark:text-zinc-400">
                Paga
              </span>
              <SimpleTextFlip
                words={["Simple", "Fácil", "Rápido", "Seguro"]}
                duration={2500}
              />
            </motion.div>
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

      {/* Action Buttons */}
      {showActions && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex w-full max-w-lg gap-3 px-4">
          {onPay && (
            <CustomButton onClick={onPay} className="flex-1">
              <CreditCard className="size-4" />
              Pagar Cuenta
            </CustomButton>
          )}
          {onSplit && (
            <CustomButton
              onClick={onSplit}
              color="#ea580c"
              className="flex-1"
            >
              <Users className="size-4" />
              Dividir
            </CustomButton>
          )}
        </div>
      )}
    </div>
  );
}
