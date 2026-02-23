/**
 * Get the start of a decade for a given date
 */
export function startOfDecade(date: Date): Date {
  const year = Math.floor(date.getFullYear() / 10) * 10;
  return new Date(year, 0, 1, 0, 0, 0, 0);
}

/**
 * Get the end of a decade for a given date
 */
export function endOfDecade(date: Date): Date {
  const year = Math.floor(date.getFullYear() / 10) * 10 + 9;
  return new Date(year, 11, 31, 23, 59, 59, 999);
}

/**
 * Get the start of a year for a given date
 */
export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

/**
 * Get the end of a year for a given date
 */
export function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Get the start of a month for a given date
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Get the end of a month for a given date
 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get the start of a day for a given date
 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Get the end of a day for a given date
 */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * Get the start of a minute for a given date
 */
export function startOfMinute(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0, 0);
}

/**
 * Get the end of a minute for a given date
 */
export function endOfMinute(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 59, 999);
}

/**
 * Clamp a date between min and max
 */
export function clampDate(date: Date, min: Date, max: Date): Date {
  if (date.getTime() < min.getTime()) return new Date(min);
  if (date.getTime() > max.getTime()) return new Date(max);
  return new Date(date);
}

/**
 * Format helpers for labels
 */
export function formatDecade(date: Date): string {
  const decadeStart = Math.floor(date.getFullYear() / 10) * 10;
  return `${decadeStart}s`;
}

export function formatYear(date: Date): string {
  return date.getFullYear().toString();
}

export function formatMonth(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDay(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

export function formatMinute(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDecisecond(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const decisecond = Math.floor(date.getMilliseconds() / 100);
  return `${hours}:${minutes}:${seconds}.${decisecond}`;
}
