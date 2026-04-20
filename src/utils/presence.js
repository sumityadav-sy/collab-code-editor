// A small list of bright colors for user cursors.
// Fixed palette is better than fully random hex colors because
// the colors stay visible and look cleaner in the UI.
export const COLORS = [
  "#e11d48", // rose
  "#db2777", // pink
  "#7c3aed", // violet
  "#2563eb", // blue
  "#059669", // green
  "#ea580c", // orange
  "#dc2626", // red
  "#0891b2", // cyan
];

// Returns one random color from the palette
export function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Creates a simple guest name
export function getRandomName() {
  const randomNumber = Math.floor(Math.random() * 1000);
  return `User-${randomNumber}`;
}