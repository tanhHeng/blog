export interface TanhBlock {
  id: string;
  left: string;
  size: string;
  tone: "light" | "pink";
  top: string;
}

interface BlockOptions {
  count?: number;
  size?: string;
  steepness?: number;
  xEnd?: number;
  xStart?: number;
  yEnd?: number;
  yStart?: number;
}

interface PathOptions {
  columns?: number;
  midpoint?: number;
  rows?: number;
  samples?: number;
  steepness?: number;
  xEnd?: number;
  xStart?: number;
  yEnd?: number;
  yStart?: number;
}

function interpolate(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function tanh01(value: number, steepness = 4.8, midpoint = 0.5) {
  return (Math.tanh((value - midpoint) * steepness) + 1) / 2;
}

export function createTanhBlocks({
  count = 15,
  xStart = 0.9,
  xEnd = 11.25,
  yStart = 7.1,
  yEnd = 1.35,
  size = "clamp(72px, 12%, 166px)",
  steepness = 4.15,
}: BlockOptions = {}): TanhBlock[] {
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 0 : index / (count - 1);
    const eased = tanh01(progress, steepness);
    const x = interpolate(xStart, xEnd, progress);
    const y = interpolate(yStart, yEnd, eased);

    return {
      id: `tanh-block-${index + 1}`,
      left: `${round((x / 12) * 100, 2)}%`,
      top: `${round((y / 8) * 100, 2)}%`,
      size,
      tone: index % 2 === 0 ? "pink" : "light",
    };
  });
}

export function createTanhPath({
  columns = 12,
  rows = 6,
  samples = 72,
  xStart = 0.35,
  xEnd = 11.85,
  yStart = 5.55,
  yEnd = 1.05,
  steepness = 5.2,
  midpoint = 0.58,
}: PathOptions = {}) {
  const points = Array.from({ length: samples }, (_, index) => {
    const progress = samples === 1 ? 0 : index / (samples - 1);
    const x = round(interpolate(xStart, xEnd, progress), 3);
    const y = round(interpolate(yStart, yEnd, tanh01(progress, steepness, midpoint)), 3);

    return `${Math.min(columns, Math.max(0, x))} ${Math.min(rows, Math.max(0, y))}`;
  });

  return `M ${points.join(" L ")}`;
}
