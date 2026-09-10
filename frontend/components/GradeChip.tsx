const TIERS = [
  { min: 9, text: "text-grade-excellent", bg: "bg-grade-excellent-bg" },
  { min: 7, text: "text-grade-good", bg: "bg-grade-good-bg" },
  { min: 5, text: "text-grade-fair", bg: "bg-grade-fair-bg" },
  { min: 1, text: "text-grade-poor", bg: "bg-grade-poor-bg" },
];

export function gradeTier(value: number) {
  return TIERS.find((t) => value >= t.min) ?? TIERS[TIERS.length - 1];
}

export default function GradeChip({ value, size = "md" }: { value: number | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-[26px] w-[26px] text-[13px]" : "h-8 w-8 text-[15px]";

  if (value === null) {
    return (
      <div className={`flex ${dim} items-center justify-center rounded-lg bg-grade-absent-bg font-bold text-grade-absent`}>
        н
      </div>
    );
  }

  const tier = gradeTier(value);
  return (
    <div className={`flex ${dim} items-center justify-center rounded-lg ${tier.bg} ${tier.text} font-bold`}>
      {value}
    </div>
  );
}
