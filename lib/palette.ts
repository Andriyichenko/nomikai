/** Traditional Japanese colours used to give each archive entry its own accent. */
export const PALETTE = [
  { name: "朱", bg: "#c23a2b", ink: "#ffffff" },
  { name: "藍", bg: "#2b4c7e", ink: "#ffffff" },
  { name: "山吹", bg: "#e0a526", ink: "#1b1a17" },
  { name: "若竹", bg: "#4f8a6b", ink: "#ffffff" },
  { name: "藤", bg: "#8b6fb0", ink: "#ffffff" },
  { name: "桃", bg: "#e48aa0", ink: "#1b1a17" },
] as const;

export const paletteAt = (i: number) => PALETTE[i % PALETTE.length];
