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
 * IVA (tax) percentage
 */
export const IVA_PERCENTAGE = 19;

/**
 * Tip preset percentages
 */
export const TIP_PRESETS = [0, 10, 15] as const;
