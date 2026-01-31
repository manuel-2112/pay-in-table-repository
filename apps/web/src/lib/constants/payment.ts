/**
 * Payment Constants
 * 
 * Constants related to payment domain.
 * Follows Single Responsibility Principle: only defines constants.
 */

/**
 * Minimum payment amount in CLP
 */
export const MIN_PAYMENT_AMOUNT = 1000;

/**
 * IVA (tax) percentage (usado cuando los precios no incluyen IVA)
 */
export const IVA_PERCENTAGE = 19;

/**
 * Chile: precios con IVA incluido; no se suma IVA al subtotal.
 */
export const IVA_INCLUDED = true;

/**
 * Propina por defecto (porcentaje) para cualquier flujo (pagar o dividir).
 */
export const DEFAULT_TIP_PERCENTAGE = 10;

/**
 * Tip preset percentages
 */
export const TIP_PRESETS = [0, 10, 15] as const;
