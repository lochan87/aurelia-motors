const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Formats a rupee amount using Indian digit grouping, for example ₹12,34,500.
 */
export function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

/**
 * Converts an integer paise amount to rupees and formats it for display.
 * Prices are stored in paise to avoid floating-point money errors.
 */
export function formatInrFromPaise(paise: number | bigint): string {
  const rupees = typeof paise === 'bigint' ? Number(paise) / 100 : paise / 100;
  return formatInr(rupees);
}
