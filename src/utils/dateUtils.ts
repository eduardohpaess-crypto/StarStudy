/**
 * Date utilities with local timezone awareness to prevent UTC date shift bugs
 */

export function getLocalDateString(dateInput: Date | string = new Date()): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates current streak in days based on study sessions
 */
export function calculateStreakFromSessions(
  sessions: { date: string; durationMinutes: number }[]
): number {
  if (!sessions || sessions.length === 0) return 0;

  const studiedDates = new Set(
    sessions
      .filter((s) => s.durationMinutes > 0)
      .map((s) => getLocalDateString(s.date))
  );

  const todayStr = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let currentStreak = 0;
  const checkDate = new Date();

  // If did not study today, check if studied yesterday
  if (!studiedDates.has(todayStr)) {
    if (!studiedDates.has(yesterdayStr)) {
      return 0; // Streak broken
    }
    // Streak is alive from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count backwards consecutive days
  while (true) {
    const dateStr = getLocalDateString(checkDate);
    if (studiedDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}
