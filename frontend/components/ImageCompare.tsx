"use client";
import { useState } from "react";

/** Before/after compare slider (UI-04). Pure CSS clip — works offline. */
export default function ImageCompare({
  before,
  after,
  beforeLabel,
  afterLabel,
}: {
  before: string;
  after: string;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ltr relative aspect-[8/5] w-full select-none overflow-hidden rounded-lg border border-line">
      {/* after fills; before clipped on top */}
      <img src={after} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: `${10000 / pos}%`, maxWidth: "none" }}
          draggable={false}
        />
      </div>
      {/* divider */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-accent shadow-[0_0_8px_rgba(45,212,191,0.8)]"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full border border-accent bg-bg text-[10px] text-accent">
          ⇄
        </div>
      </div>
      <span className="absolute left-2 top-2 rounded bg-bg/80 px-2 py-0.5 text-[11px]">
        {beforeLabel}
      </span>
      <span className="absolute right-2 top-2 rounded bg-bg/80 px-2 py-0.5 text-[11px]">
        {afterLabel}
      </span>
      <input
        type="range"
        min={2}
        max={98}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
        aria-label="compare"
      />
    </div>
  );
}
