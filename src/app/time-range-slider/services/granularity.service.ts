import { Injectable } from '@angular/core';
import { GranularityLevel, GranularityConfig } from '../models';
import {
  snapToYear, snapToMonth, snapToDay, snapToHour, snapToMinute, snapToSecond,
  formatYearThumb, formatYearTick,
  formatMonthThumb, formatMonthTick,
  formatDayThumb, formatDayTick,
  formatHourThumb, formatHourTick,
  formatMinuteThumb, formatMinuteTick,
  formatSecondThumb, formatSecondTick
} from '../utils/date-utils';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

// Thresholds for transitioning TO a finer granularity (narrowing)
// Hysteresis: widen threshold is ~4x the narrow threshold to prevent flicker
const GRANULARITY_THRESHOLDS: { level: GranularityLevel; narrowBelow: number; widenAbove: number }[] = [
  { level: 'years',   narrowBelow: Infinity,        widenAbove: Infinity },
  { level: 'months',  narrowBelow: 5 * MS_PER_YEAR, widenAbove: 8 * MS_PER_YEAR },
  { level: 'days',    narrowBelow: 90 * MS_PER_DAY,  widenAbove: 400 * MS_PER_DAY },
  { level: 'hours',   narrowBelow: 3 * MS_PER_DAY,   widenAbove: 10 * MS_PER_DAY },
  { level: 'minutes', narrowBelow: 2 * MS_PER_HOUR,  widenAbove: 8 * MS_PER_HOUR },
  { level: 'seconds', narrowBelow: 5 * MS_PER_MINUTE, widenAbove: 15 * MS_PER_MINUTE },
];

@Injectable({
  providedIn: 'root'
})
export class GranularityService {

  private configs: Map<GranularityLevel, GranularityConfig> = new Map([
    ['years', {
      level: 'years',
      label: 'Years',
      snapFn: snapToYear,
      formatThumb: formatYearThumb,
      formatTick: formatYearTick
    }],
    ['months', {
      level: 'months',
      label: 'Months',
      snapFn: snapToMonth,
      formatThumb: formatMonthThumb,
      formatTick: formatMonthTick
    }],
    ['days', {
      level: 'days',
      label: 'Days',
      snapFn: snapToDay,
      formatThumb: formatDayThumb,
      formatTick: formatDayTick
    }],
    ['hours', {
      level: 'hours',
      label: 'Hours',
      snapFn: snapToHour,
      formatThumb: formatHourThumb,
      formatTick: formatHourTick
    }],
    ['minutes', {
      level: 'minutes',
      label: 'Minutes',
      snapFn: snapToMinute,
      formatThumb: formatMinuteThumb,
      formatTick: formatMinuteTick
    }],
    ['seconds', {
      level: 'seconds',
      label: 'Seconds',
      snapFn: snapToSecond,
      formatThumb: formatSecondThumb,
      formatTick: formatSecondTick
    }]
  ]);

  getConfig(level: GranularityLevel): GranularityConfig {
    return this.configs.get(level)!;
  }

  /**
   * Determine the appropriate granularity for a given selection width,
   * considering the current level for hysteresis.
   */
  determineGranularity(selectionMs: number, currentLevel: GranularityLevel): GranularityLevel {
    const currentIdx = GRANULARITY_THRESHOLDS.findIndex(t => t.level === currentLevel);

    // Check if we should go finer (narrowing)
    for (let i = GRANULARITY_THRESHOLDS.length - 1; i > currentIdx; i--) {
      if (selectionMs < GRANULARITY_THRESHOLDS[i].narrowBelow) {
        // Check all levels between current and target also qualify
        let allQualify = true;
        for (let j = currentIdx + 1; j <= i; j++) {
          if (selectionMs >= GRANULARITY_THRESHOLDS[j].narrowBelow) {
            allQualify = false;
            break;
          }
        }
        if (allQualify) {
          return GRANULARITY_THRESHOLDS[i].level;
        }
      }
    }

    // Check if we should go coarser (widening)
    for (let i = 0; i < currentIdx; i++) {
      if (selectionMs > GRANULARITY_THRESHOLDS[currentIdx].widenAbove) {
        return GRANULARITY_THRESHOLDS[currentIdx - 1].level;
      }
    }

    return currentLevel;
  }

  /**
   * Determine the initial granularity for a data range (no hysteresis needed).
   */
  initialGranularity(rangeMs: number): GranularityLevel {
    for (let i = GRANULARITY_THRESHOLDS.length - 1; i >= 1; i--) {
      if (rangeMs < GRANULARITY_THRESHOLDS[i].narrowBelow) {
        return GRANULARITY_THRESHOLDS[i].level;
      }
    }
    return 'years';
  }

  /**
   * Generate tick labels for the view extent.
   * Major ticks (parent boundaries) are generated independently and always appear.
   * Minor ticks fill in between them.
   */
  generateTicks(
    startDate: Date,
    endDate: Date,
    level: GranularityLevel,
    extentStart: Date,
    extentEnd: Date
  ): { position: number; label: string; major: boolean; majorLabel?: string }[] {
    const config = this.getConfig(level);
    const extentMs = extentEnd.getTime() - extentStart.getTime();
    if (extentMs <= 0) return [];

    const ticks: { position: number; label: string; major: boolean; majorLabel?: string }[] = [];
    const majorTimestamps = new Set<number>();

    // 1. Generate major ticks (parent-level boundaries) — these always appear
    const majorDates = this.generateMajorTickDates(startDate, endDate, level);
    for (const tickDate of majorDates) {
      const ratio = (tickDate.getTime() - extentStart.getTime()) / extentMs;
      if (ratio > 0.02 && ratio < 0.98) { // Avoid crowding the edges
        const label = this.majorTickLabel(tickDate, level);
        ticks.push({
          position: ratio * 100,
          label: config.formatTick(tickDate),
          major: true,
          majorLabel: label
        });
        majorTimestamps.add(tickDate.getTime());
      }
    }

    // 2. Generate minor ticks — skip any that coincide with major ticks
    const minorDates = this.generateTickDates(startDate, endDate, level);
    for (const tickDate of minorDates) {
      if (majorTimestamps.has(tickDate.getTime())) continue;
      const ratio = (tickDate.getTime() - extentStart.getTime()) / extentMs;
      if (ratio >= 0 && ratio <= 1) {
        ticks.push({
          position: ratio * 100,
          label: config.formatTick(tickDate),
          major: false
        });
      }
    }

    // Sort by position
    ticks.sort((a, b) => a.position - b.position);
    return ticks;
  }

  /**
   * Generate dates for parent-level boundaries within the range.
   */
  private generateMajorTickDates(start: Date, end: Date, level: GranularityLevel): Date[] {
    const dates: Date[] = [];
    switch (level) {
      case 'months': {
        // Year boundaries (Jan 1)
        for (let y = start.getFullYear() + 1; y <= end.getFullYear(); y++) {
          dates.push(new Date(y, 0, 1));
        }
        break;
      }
      case 'days': {
        // Month boundaries (1st of month)
        let current = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        }
        break;
      }
      case 'hours': {
        // Day boundaries (midnight)
        let current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
        }
        break;
      }
      case 'minutes': {
        // Hour boundaries (top of hour)
        let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours() + 1);
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getTime() + 60 * 60 * 1000);
        }
        break;
      }
      case 'seconds': {
        // Minute boundaries (top of minute)
        let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes() + 1);
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getTime() + 60 * 1000);
        }
        break;
      }
      // 'years' has no parent level
    }
    return dates;
  }

  /**
   * Format the label for a major tick.
   */
  private majorTickLabel(date: Date, level: GranularityLevel): string {
    switch (level) {
      case 'months':  return formatYearTick(date);
      case 'days':    return formatMonthTick(date);
      case 'hours':   return formatDayTick(date);
      case 'minutes': return formatHourTick(date);
      case 'seconds': return formatMinuteTick(date);
      default:        return '';
    }
  }

  private generateTickDates(start: Date, end: Date, level: GranularityLevel): Date[] {
    const dates: Date[] = [];
    const MAX_TICKS = 7;

    switch (level) {
      case 'years': {
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        const span = endYear - startYear;
        const step = Math.max(1, Math.ceil(span / MAX_TICKS));
        const firstYear = Math.ceil(startYear / step) * step;
        for (let y = firstYear; y <= endYear; y += step) {
          dates.push(new Date(y, 0, 1));
        }
        break;
      }
      case 'months': {
        const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        const step = Math.max(1, Math.ceil(totalMonths / MAX_TICKS));
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getFullYear(), current.getMonth() + step, 1);
        }
        break;
      }
      case 'days': {
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        const step = Math.max(1, Math.ceil(totalDays / MAX_TICKS));
        let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + step);
        }
        break;
      }
      case 'hours': {
        const totalHours = Math.ceil((end.getTime() - start.getTime()) / (60 * 60 * 1000));
        const step = Math.max(1, Math.ceil(totalHours / MAX_TICKS));
        let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours());
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getTime() + step * 60 * 60 * 1000);
        }
        break;
      }
      case 'minutes': {
        const totalMinutes = Math.ceil((end.getTime() - start.getTime()) / (60 * 1000));
        const step = Math.max(1, Math.ceil(totalMinutes / MAX_TICKS));
        let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes());
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getTime() + step * 60 * 1000);
        }
        break;
      }
      case 'seconds': {
        const totalSeconds = Math.ceil((end.getTime() - start.getTime()) / 1000);
        const step = Math.max(1, Math.ceil(totalSeconds / MAX_TICKS));
        let current = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours(), start.getMinutes(), start.getSeconds());
        while (current.getTime() <= end.getTime()) {
          dates.push(new Date(current));
          current = new Date(current.getTime() + step * 1000);
        }
        break;
      }
    }

    return dates;
  }
}
