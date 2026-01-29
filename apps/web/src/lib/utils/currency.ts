/**
 * Currency Utilities
 * 
 * Pure functions for currency formatting.
 * Follows Single Responsibility Principle: only handles currency formatting.
 */

/**
 * Format amount as CLP (Chilean Peso)
 * 
 * @param amount - Amount in CLP (integer, no decimals)
 * @returns Formatted string (e.g., "$15.000")
 * 
 * @example
 * ```ts
 * formatCLP(15000) // "$15.000"
 * formatCLP(1234567) // "$1.234.567"
 * ```
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format amount as CLP without currency symbol
 * 
 * @param amount - Amount in CLP
 * @returns Formatted string (e.g., "15.000")
 */
export function formatCLPAmount(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency (legacy compatibility)
 * @deprecated Use formatCLP instead
 */
export function formatCurrency(amount: number): string {
  return formatCLP(amount);
}
