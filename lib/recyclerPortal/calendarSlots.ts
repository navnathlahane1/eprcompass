/**
 * Shared slot-computation helpers for the recycler booking calendar.
 * No timezone library dependency — uses the Intl offset trick to convert a
 * wall-clock date+time in an IANA timezone to a UTC Date.
 */

export interface AvailabilityRule {
  day_of_week: number; // 0 = Sunday
  start_time: string;  // 'HH:MM:SS' or 'HH:MM'
  end_time: string;
}

export interface ExistingBooking {
  start_at: string; // ISO
  end_at: string;
}

/** Convert a wall-clock date+time (in `timeZone`) to a UTC Date. */
export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const naiveUtc = new Date(`${dateStr}T${timeStr.slice(0, 5)}:00Z`);
  const tzString = naiveUtc.toLocaleString('en-US', { timeZone });
  const utcString = naiveUtc.toLocaleString('en-US', { timeZone: 'UTC' });
  const diffMs = new Date(utcString).getTime() - new Date(tzString).getTime();
  return new Date(naiveUtc.getTime() + diffMs);
}

/** Generate available start times (UTC Dates) for one calendar day. */
export function computeSlotsForDay(opts: {
  dateStr: string; // 'YYYY-MM-DD'
  timeZone: string;
  meetingDurationMin: number;
  bufferMin: number;
  rules: AvailabilityRule[];
  existingBookings: ExistingBooking[];
  now?: Date;
}): { start: Date; end: Date }[] {
  const { dateStr, timeZone, meetingDurationMin, bufferMin, rules, existingBookings } = opts;
  const now = opts.now ?? new Date();

  const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const dayRules = rules.filter((r) => r.day_of_week === dayOfWeek);
  const stepMin = meetingDurationMin + bufferMin;

  const slots: { start: Date; end: Date }[] = [];

  for (const rule of dayRules) {
    let cursor = zonedTimeToUtc(dateStr, rule.start_time, timeZone);
    const windowEnd = zonedTimeToUtc(dateStr, rule.end_time, timeZone);

    while (cursor.getTime() + meetingDurationMin * 60000 <= windowEnd.getTime()) {
      const slotEnd = new Date(cursor.getTime() + meetingDurationMin * 60000);

      const inPast = cursor.getTime() < now.getTime();
      const overlaps = existingBookings.some((b) => {
        const bStart = new Date(b.start_at).getTime();
        const bEnd = new Date(b.end_at).getTime();
        return cursor.getTime() < bEnd && slotEnd.getTime() > bStart;
      });

      if (!inPast && !overlaps) slots.push({ start: cursor, end: slotEnd });

      cursor = new Date(cursor.getTime() + stepMin * 60000);
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
