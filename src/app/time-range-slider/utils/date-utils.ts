const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// --- Snap functions (round to nearest boundary) ---

export function snapToYear(date: Date): Date {
  const year = date.getFullYear();
  const mid = new Date(year, 6, 1);
  if (date.getTime() >= mid.getTime()) {
    return new Date(year + 1, 0, 1, 0, 0, 0, 0);
  }
  return new Date(year, 0, 1, 0, 0, 0, 0);
}

export function snapToMonth(date: Date): Date {
  const day = date.getDate();
  if (day >= 16) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function snapToDay(date: Date): Date {
  const hour = date.getHours();
  if (hour >= 12) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function snapToHour(date: Date): Date {
  const min = date.getMinutes();
  if (min >= 30) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1, 0, 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);
}

export function snapToMinute(date: Date): Date {
  const sec = date.getSeconds();
  if (sec >= 30) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + 1, 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0, 0);
}

export function snapToSecond(date: Date): Date {
  const ms = date.getMilliseconds();
  if (ms >= 500) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds() + 1, 0);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), 0);
}

// --- Format functions ---

export function formatFullDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatFullDateTime(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatFullDateTimeSec(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatYearThumb(date: Date): string {
  return formatFullDateTimeSec(date);
}

export function formatYearTick(date: Date): string {
  return date.getFullYear().toString();
}

export function formatMonthThumb(date: Date): string {
  return formatFullDateTimeSec(date);
}

export function formatMonthTick(date: Date): string {
  // Short: "Oct '06" — full year only for January to anchor the viewer
  if (date.getMonth() === 0) {
    return `${date.getFullYear()}`;
  }
  return `${MONTHS[date.getMonth()]}`;
}

export function formatDayThumb(date: Date): string {
  return formatFullDateTimeSec(date);
}

export function formatDayTick(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatHourThumb(date: Date): string {
  return formatFullDateTimeSec(date);
}

export function formatHourTick(date: Date): string {
  return `${pad(date.getHours())}:00`;
}

export function formatMinuteThumb(date: Date): string {
  return formatFullDateTimeSec(date);
}

export function formatMinuteTick(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatSecondThumb(date: Date): string {
  return formatFullDateTimeSec(date);
}

export function formatSecondTick(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// --- Clamp ---

export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date.getTime() < min.getTime()) return new Date(min.getTime());
  if (date.getTime() > max.getTime()) return new Date(max.getTime());
  return date;
}
