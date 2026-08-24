import { describe, expect, it } from "vitest";
import { calculatePrizeDistribution, type PrizeEngineAward } from "@/services/prizeEngine";

const prizes = [
  { position: 1, amount: "900" },
  { position: 2, amount: "450" },
  { position: 3, amount: "150" },
];

function byUserId(awards: PrizeEngineAward[], userId: string) {
  const award = awards.find((a) => a.userId === userId);
  if (!award) throw new Error(`no award for ${userId}`);
  return award;
}

describe("calculatePrizeDistribution", () => {
  it("awards distinct prizes when nobody ties", () => {
    const awards = calculatePrizeDistribution(
      [
        { userId: "A", points: 80 },
        { userId: "B", points: 70 },
        { userId: "C", points: 60 },
      ],
      prizes,
    );
    expect(byUserId(awards, "A").prizeAwarded.toString()).toBe("900");
    expect(byUserId(awards, "A").rank).toBe(1);
    expect(byUserId(awards, "B").prizeAwarded.toString()).toBe("450");
    expect(byUserId(awards, "C").prizeAwarded.toString()).toBe("150");
    awards.forEach((a) => expect(a.tieGroupSize).toBe(1));
  });

  it("spec example: two-way tie for first splits 1st+2nd, third place gets 3rd prize", () => {
    const awards = calculatePrizeDistribution(
      [
        { userId: "Mube", points: 78 },
        { userId: "Jordan", points: 78 },
        { userId: "Yoseph", points: 71 },
      ],
      prizes,
    );
    expect(byUserId(awards, "Mube").rank).toBe(1);
    expect(byUserId(awards, "Jordan").rank).toBe(1);
    expect(byUserId(awards, "Mube").prizeAwarded.toString()).toBe("675");
    expect(byUserId(awards, "Jordan").prizeAwarded.toString()).toBe("675");
    expect(byUserId(awards, "Mube").prizePositionsConsumed).toEqual([1, 2]);
    // The next distinct rank is 1 + 2 = 3, never "2".
    expect(byUserId(awards, "Yoseph").rank).toBe(3);
    expect(byUserId(awards, "Yoseph").prizeAwarded.toString()).toBe("150");
  });

  it("spec example: three-way tie splits 1st+2nd+3rd, fourth place gets nothing", () => {
    const awards = calculatePrizeDistribution(
      [
        { userId: "A", points: 80 },
        { userId: "B", points: 80 },
        { userId: "C", points: 80 },
        { userId: "D", points: 70 },
      ],
      prizes,
    );
    for (const id of ["A", "B", "C"]) {
      expect(byUserId(awards, id).rank).toBe(1);
      expect(byUserId(awards, id).prizeAwarded.toString()).toBe("500");
    }
    expect(byUserId(awards, "D").rank).toBe(4);
    expect(byUserId(awards, "D").prizeAwarded.toString()).toBe("0");
    expect(byUserId(awards, "D").prizePositionsConsumed).toEqual([]);
  });

  it("four-way tie never invents a 4th prize position", () => {
    const awards = calculatePrizeDistribution(
      [
        { userId: "A", points: 80 },
        { userId: "B", points: 80 },
        { userId: "C", points: 80 },
        { userId: "D", points: 80 },
        { userId: "E", points: 70 },
      ],
      prizes,
    );
    for (const id of ["A", "B", "C", "D"]) {
      expect(byUserId(awards, id).rank).toBe(1);
      expect(byUserId(awards, id).prizeAwarded.toString()).toBe("375");
      expect(byUserId(awards, id).prizePositionsConsumed).toEqual([1, 2, 3]);
    }
    expect(byUserId(awards, "E").rank).toBe(5);
    expect(byUserId(awards, "E").prizeAwarded.toString()).toBe("0");
  });

  it("a tie straddling the last configured position only counts the configured part", () => {
    // Ranks 1 and 2 go to distinct scores; ranks 3-4 tie but only prize
    // position 3 exists (150), so the pair splits 150, not 150+nothing.
    const awards = calculatePrizeDistribution(
      [
        { userId: "A", points: 100 },
        { userId: "B", points: 90 },
        { userId: "C", points: 80 },
        { userId: "D", points: 80 },
      ],
      prizes,
    );
    expect(byUserId(awards, "C").rank).toBe(3);
    expect(byUserId(awards, "D").rank).toBe(3);
    expect(byUserId(awards, "C").prizePositionsConsumed).toEqual([3]);
    expect(byUserId(awards, "C").prizeAwarded.toString()).toBe("75");
    expect(byUserId(awards, "D").prizeAwarded.toString()).toBe("75");
  });

  it("a tie starting entirely past the configured positions awards nothing, next rank is still P+N", () => {
    const awards = calculatePrizeDistribution(
      [
        { userId: "A", points: 100 },
        { userId: "B", points: 90 },
        { userId: "C", points: 80 },
        { userId: "D", points: 70 },
        { userId: "E", points: 70 },
      ],
      prizes,
    );
    expect(byUserId(awards, "D").rank).toBe(4);
    expect(byUserId(awards, "E").rank).toBe(4);
    expect(byUserId(awards, "D").prizeAwarded.toString()).toBe("0");
    expect(byUserId(awards, "D").prizePositionsConsumed).toEqual([]);
  });

  it("distributes remainder cents one at a time, exactly reconciling the pool", () => {
    const sevenWay = Array.from({ length: 7 }, (_, i) => ({ userId: `U${i}`, points: 50 }));
    const awards = calculatePrizeDistribution(sevenWay, [{ position: 1, amount: "100" }]);
    const amounts = awards.map((a) => a.prizeAwarded.toFixed(2)).sort();
    const highCount = amounts.filter((a) => a === "14.29").length;
    const lowCount = amounts.filter((a) => a === "14.28").length;
    expect(highCount).toBe(4);
    expect(lowCount).toBe(3);
    const total = awards.reduce((sum, a) => sum + Number(a.prizeAwarded), 0);
    expect(total.toFixed(2)).toBe("100.00");
  });

  it("handles zero-amount prize positions without crashing", () => {
    const awards = calculatePrizeDistribution(
      [
        { userId: "A", points: 50 },
        { userId: "B", points: 40 },
      ],
      [
        { position: 1, amount: "0" },
        { position: 2, amount: "0" },
      ],
    );
    expect(byUserId(awards, "A").prizeAwarded.toString()).toBe("0");
    expect(byUserId(awards, "B").prizeAwarded.toString()).toBe("0");
  });

  it("handles no prize positions configured at all", () => {
    const awards = calculatePrizeDistribution([{ userId: "A", points: 50 }], []);
    expect(byUserId(awards, "A").prizeAwarded.toString()).toBe("0");
    expect(byUserId(awards, "A").prizePositionsConsumed).toEqual([]);
  });

  it("throws on duplicate participant userIds", () => {
    expect(() =>
      calculatePrizeDistribution(
        [
          { userId: "A", points: 50 },
          { userId: "A", points: 40 },
        ],
        prizes,
      ),
    ).toThrow(/duplicate/i);
  });

  it("throws on non-contiguous prize positions", () => {
    expect(() =>
      calculatePrizeDistribution(
        [{ userId: "A", points: 50 }],
        [
          { position: 1, amount: "900" },
          { position: 3, amount: "150" },
        ],
      ),
    ).toThrow(/contiguous/i);
  });

  it("does not crash on negative points", () => {
    const awards = calculatePrizeDistribution(
      [
        { userId: "A", points: -5 },
        { userId: "B", points: -10 },
      ],
      prizes,
    );
    expect(byUserId(awards, "A").rank).toBe(1);
    expect(byUserId(awards, "B").rank).toBe(2);
  });

  it("returns an empty list for zero participants", () => {
    expect(calculatePrizeDistribution([], prizes)).toEqual([]);
  });
});
