import { levelOf } from "@/lib/types";
import { levelColor, levelDot } from "@/lib/format";

export default function ScoreBadge({ score }: { score: number }) {
  const lv = levelOf(score);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-head tabular-nums"
      style={{ color: levelColor[lv], background: `${levelColor[lv]}1a` }}
    >
      <span>{levelDot[lv]}</span>
      {Math.round(score)}
    </span>
  );
}
