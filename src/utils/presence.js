export const COLORS = [
  "#e11d48", // rose
  "#db2777", // pink
  "#7c3aed", // violet
  "#2563eb", // blue
  "#059669", // green
  "#ea580c", // orange
  "#f59e0b", // amber
  "#0891b2", // cyan
  "#10b981", // emerald
  "#8b5cf6", // purple
  "#ec4899", // fuchsia
  "#14b8a6", // teal
];

/**
 * Pick a color that isn't already taken by any other user.
 * @param {string[]} takenColors - array of hex colors already in use
 */
export function getUniqueColor(takenColors = []) {
  const available = COLORS.filter((c) => !takenColors.includes(c));
  // If somehow all colors are taken (>12 users), fall back to random
  const pool = available.length > 0 ? available : COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Legacy export kept for safety — prefer getUniqueColor
export function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function getRandomName() {
  const randomNumber = Math.floor(Math.random() * 1000);
  return `User-${randomNumber}`;
}
