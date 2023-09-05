// Function to parse a color value
export function parseColor(colorValue: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const match = colorValue.match(
    /rgba?\((\d+), (\d+), (\d+)(, (\d+(\.\d+)?))?\)/
  );
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[5] ? parseFloat(match[5]) : 1,
    };
  }
  return {
    r: 255,
    g: 255,
    b: 255,
    a: 1,
  };
}

// Function to lighten a color
export function lightenColor(
  color: { r: number; g: number; b: number; a: number },
  percent: number
): { r: number; g: number; b: number; a: number } {
  const factor = percent / 100;
  return {
    r: color.r,
    g: color.g,
    b: color.b,
    a: Math.min(1, factor),
  };
}
