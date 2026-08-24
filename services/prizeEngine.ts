import { Prisma } from "@/lib/generated/prisma/client";
import { toCents, fromCents, type MoneyInput } from "@/lib/money";

export interface PrizeEngineParticipant {
  userId: string;
  points: number;
}

export interface PrizeEnginePosition {
  position: number;
  amount: MoneyInput;
}

export interface PrizeEngineAward {
  userId: string;
  points: number;
  rank: number;
  tieGroupSize: number;
  prizePositionsConsumed: number[];
  prizeAwarded: Prisma.Decimal;
  roundingAdjustment: Prisma.Decimal;
}

/**
 * Splits a Game Week's prize pool across participants using standard
 * "competition ranking" (1-2-2-4): a group of N players tied for a rank
 * shares every prize position that rank occupies (positions P..P+N-1),
 * split as evenly as possible, and the next distinct rank is P+N — never
 * P+1, and never a prize position beyond what's configured.
 */
export function calculatePrizeDistribution(
  participants: PrizeEngineParticipant[],
  prizePositions: PrizeEnginePosition[],
): PrizeEngineAward[] {
  if (participants.length === 0) return [];

  const seenUserIds = new Set<string>();
  for (const participant of participants) {
    if (seenUserIds.has(participant.userId)) {
      throw new Error(`Duplicate participant in prize calculation: ${participant.userId}`);
    }
    seenUserIds.add(participant.userId);
  }

  const positions = [...prizePositions].sort((a, b) => a.position - b.position);
  positions.forEach((entry, index) => {
    if (entry.position !== index + 1) {
      throw new Error(
        `Prize positions must be contiguous starting at 1, got: ${positions.map((p) => p.position).join(", ")}`,
      );
    }
  });
  const maxConfiguredPosition = positions.length;
  const centsForPosition = (position: number): bigint =>
    position <= maxConfiguredPosition ? toCents(positions[position - 1].amount) : 0n;

  const sortedParticipants = [...participants].sort((a, b) =>
    b.points !== a.points ? b.points - a.points : a.userId.localeCompare(b.userId),
  );

  const awards: PrizeEngineAward[] = [];
  let index = 0;
  while (index < sortedParticipants.length) {
    let groupEnd = index;
    while (
      groupEnd < sortedParticipants.length &&
      sortedParticipants[groupEnd].points === sortedParticipants[index].points
    ) {
      groupEnd++;
    }
    const group = sortedParticipants.slice(index, groupEnd);
    const groupSize = group.length;
    const rank = index + 1;
    const lastPositionOccupied = Math.min(index + groupSize, maxConfiguredPosition);

    let totalCents = 0n;
    const positionsConsumed: number[] = [];
    if (rank <= maxConfiguredPosition) {
      for (let position = rank; position <= lastPositionOccupied; position++) {
        totalCents += centsForPosition(position);
        positionsConsumed.push(position);
      }
    }

    const groupSizeBig = BigInt(groupSize);
    const baseCents = totalCents / groupSizeBig;
    const remainderCents = Number(totalCents % groupSizeBig);
    // Remainder cents go to the first members alphabetically by userId — arbitrary
    // but deterministic, so re-running this on the same input always agrees.
    const orderedGroup = [...group].sort((a, b) => a.userId.localeCompare(b.userId));

    orderedGroup.forEach((member, memberIndex) => {
      const extraCent = memberIndex < remainderCents ? 1n : 0n;
      const awardCents = baseCents + extraCent;
      awards.push({
        userId: member.userId,
        points: member.points,
        rank,
        tieGroupSize: groupSize,
        prizePositionsConsumed: positionsConsumed,
        prizeAwarded: fromCents(awardCents),
        roundingAdjustment: fromCents(extraCent),
      });
    });

    index = groupEnd;
  }

  const totalDistributedCents = awards.reduce((sum, award) => sum + toCents(award.prizeAwarded), 0n);
  const totalPoolCents = positions.reduce((sum, position) => sum + toCents(position.amount), 0n);
  if (totalDistributedCents > totalPoolCents) {
    throw new Error("Prize engine distributed more than the configured pool — this is a bug.");
  }

  return awards;
}
