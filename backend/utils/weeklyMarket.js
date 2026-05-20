function getWeekWindowUTC(now = new Date()) {
  const d = new Date(now.getTime());
  const day = d.getUTCDay();
  const daysSinceMonday = (day + 6) % 7; 

  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  d.setUTCHours(0, 0, 0, 0);

  const weekStart = d;
  const weekEndsAt = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekKey = Math.floor(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000));

  return { weekKey, weekStart, weekEndsAt };
}

function isPackActiveThisWeek(pack, weekKey) {
  if (!pack || pack.rotation !== "weekly") return false;
  if (!pack.visible) return false;

  const N = Number(pack.weeklySlotsCount);
  const slot = Number(pack.weeklySlot);

  if (!Number.isFinite(N) || N <= 0) return false;
  if (!Number.isFinite(slot) || slot < 0) return false;

  return (weekKey % N) === slot;
}

module.exports = {
  getWeekWindowUTC,
  isPackActiveThisWeek,
};

