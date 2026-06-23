// Formatting helpers shared by the clock screens.

export function formatTime(
  date: Date,
  opts: { use24Hour: boolean; showSeconds: boolean; timeZone?: string }
): { time: string; meridiem: string | null } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: opts.showSeconds ? '2-digit' : undefined,
    hour12: !opts.use24Hour,
    timeZone: opts.timeZone,
  });

  const parts = formatter.formatToParts(date);
  let time = '';
  let meridiem: string | null = null;
  for (const p of parts) {
    if (p.type === 'dayPeriod') {
      meridiem = p.value.toUpperCase();
    } else if (p.type !== 'literal' || p.value.trim() !== '') {
      time += p.value;
    }
  }
  return { time: time.replace(/\s?(AM|PM)$/i, '').trim(), meridiem };
}

export function formatDate(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(date);
}

/** Components (hour/minute/second) for a given timezone — used by the analog clock. */
export function getClockParts(date: Date, timeZone?: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    timeZone,
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  let hours = get('hour');
  if (hours === 24) hours = 0;
  return { hours, minutes: get('minute'), seconds: get('second') };
}
