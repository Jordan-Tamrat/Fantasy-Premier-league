import Decimal from "decimal.js";

// All money in this app is Decimal(10,2) end to end. These helpers are the
// only place cents/BigInt conversion happens, so the split math in
// services/prizeEngine.ts never touches floating point.
//
// This deliberately depends on decimal.js directly rather than importing
// Prisma.Decimal from the generated client: that pulls Prisma's whole
// Node-only runtime (fs/crypto/async_hooks/...) into any client component
// that imports formatMoney, which fails to bundle. Prisma's Decimal fields
// are themselves decimal.js instances, so they interoperate fine here.

export type MoneyInput = string | number | Decimal;

export { Decimal };

export function decimal(value: MoneyInput): Decimal {
  return new Decimal(value);
}

export function toCents(amount: MoneyInput): bigint {
  return BigInt(decimal(amount).toDecimalPlaces(2).times(100).toFixed(0));
}

export function fromCents(cents: bigint): Decimal {
  return new Decimal(cents.toString()).dividedBy(100);
}

export function sumDecimal(values: MoneyInput[]): Decimal {
  return values.reduce<Decimal>((total, value) => total.plus(value), new Decimal(0));
}

export function formatMoney(amount: MoneyInput, currency = "ETB"): string {
  return `${decimal(amount).toFixed(2)} ${currency}`;
}
