// Rentals are weekly. Every rental is keyed to the Monday (UTC) of its week so
// "one rental per driver per week" can be enforced with a unique index.
export function startOfWeekUTC(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}
