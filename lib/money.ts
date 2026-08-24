import { Prisma } from "@/lib/generated/prisma/client";

// All money in this app is Decimal(10,2) end to end. These helpers are the
// only place cents/BigInt conversion happens, so the split math in
// services/prizeEngine.ts never touches floating point.

export type MoneyInput = string | number | Prisma.Decimal;

export function decimal(value: MoneyInput): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function toCents(amount: MoneyInput): bigint {
  return BigInt(decimal(amount).toDecimalPlaces(2).times(100).toFixed(0));
}

export function fromCents(cents: bigint): Prisma.Decimal {
  return new Prisma.Decimal(cents.toString()).dividedBy(100);
}

export function sumDecimal(values: MoneyInput[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>(
    (total, value) => total.plus(value),
    new Prisma.Decimal(0),
  );
}

export function formatMoney(amount: MoneyInput, currency = "ETB"): string {
  return `${decimal(amount).toFixed(2)} ${currency}`;
}
