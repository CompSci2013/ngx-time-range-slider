import { Injectable } from '@angular/core';
import { GranularityLevel, GranularityConfig, GRANULARITY_ORDER } from '../models';
import {
  startOfDecade, endOfDecade,
  startOfYear, endOfYear,
  startOfMonth, endOfMonth,
  startOfDay, endOfDay,
  startOfMinute, endOfMinute,
  formatDecade, formatYear, formatMonth, formatDay, formatMinute, formatDecisecond,
  clampDate
} from '../utils/date-utils';

const MS_PER_DECISECOND = 100;
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

@Injectable({
  providedIn: 'root'
})
export class GranularityService {

  private configs: Map<GranularityLevel, GranularityConfig> = new Map([
    ['decades', {
      level: 'decades',
      stepMs: 10 * 365.25 * MS_PER_DAY,
      labelFormat: formatDecade,
      naturalExtent: (date: Date) => ({ start: startOfDecade(date), end: endOfDecade(date) })
    }],
    ['years', {
      level: 'years',
      stepMs: 365.25 * MS_PER_DAY,
      labelFormat: formatYear,
      naturalExtent: (date: Date) => ({ start: startOfYear(date), end: endOfYear(date) })
    }],
    ['months', {
      level: 'months',
      stepMs: 30.44 * MS_PER_DAY, // Average month
      labelFormat: formatMonth,
      naturalExtent: (date: Date) => ({ start: startOfMonth(date), end: endOfMonth(date) })
    }],
    ['days', {
      level: 'days',
      stepMs: MS_PER_DAY,
      labelFormat: formatDay,
      naturalExtent: (date: Date) => ({ start: startOfDay(date), end: endOfDay(date) })
    }],
    ['minutes', {
      level: 'minutes',
      stepMs: MS_PER_MINUTE,
      labelFormat: formatMinute,
      naturalExtent: (date: Date) => ({ start: startOfMinute(date), end: endOfMinute(date) })
    }],
    ['deciseconds', {
      level: 'deciseconds',
      stepMs: MS_PER_DECISECOND,
      labelFormat: formatDecisecond,
      naturalExtent: (date: Date) => ({
        start: new Date(Math.floor(date.getTime() / MS_PER_DECISECOND) * MS_PER_DECISECOND),
        end: new Date(Math.floor(date.getTime() / MS_PER_DECISECOND) * MS_PER_DECISECOND + MS_PER_DECISECOND - 1)
      })
    }]
  ]);

  getConfig(level: GranularityLevel): GranularityConfig {
    return this.configs.get(level)!;
  }

  canZoomIn(level: GranularityLevel): boolean {
    const index = GRANULARITY_ORDER.indexOf(level);
    return index < GRANULARITY_ORDER.length - 1;
  }

  canZoomOut(level: GranularityLevel): boolean {
    const index = GRANULARITY_ORDER.indexOf(level);
    return index > 0;
  }

  zoomIn(level: GranularityLevel): GranularityLevel {
    const index = GRANULARITY_ORDER.indexOf(level);
    if (index < GRANULARITY_ORDER.length - 1) {
      return GRANULARITY_ORDER[index + 1];
    }
    return level;
  }

  zoomOut(level: GranularityLevel): GranularityLevel {
    const index = GRANULARITY_ORDER.indexOf(level);
    if (index > 0) {
      return GRANULARITY_ORDER[index - 1];
    }
    return level;
  }

  /**
   * Calculate the natural extent when zooming out.
   * Expands symmetrically to contain the current selection within natural boundaries.
   */
  calculateZoomOutExtent(
    currentStart: Date,
    currentEnd: Date,
    newLevel: GranularityLevel,
    minDate: Date,
    maxDate: Date
  ): { extentStart: Date; extentEnd: Date } {
    const config = this.getConfig(newLevel);

    // Get natural boundaries for both ends
    const startNatural = config.naturalExtent(currentStart);
    const endNatural = config.naturalExtent(currentEnd);

    // Extent spans from the natural start of selection start to natural end of selection end
    let extentStart = startNatural.start;
    let extentEnd = endNatural.end;

    // Clamp to bounds
    extentStart = clampDate(extentStart, minDate, maxDate);
    extentEnd = clampDate(extentEnd, minDate, maxDate);

    return { extentStart, extentEnd };
  }

  /**
   * Calculate the new extent when zooming in.
   * The current selection becomes the new extent.
   */
  calculateZoomInExtent(
    selectionStart: Date,
    selectionEnd: Date,
    newLevel: GranularityLevel
  ): { extentStart: Date; extentEnd: Date } {
    const config = this.getConfig(newLevel);

    // Snap to natural boundaries at the new level
    const startNatural = config.naturalExtent(selectionStart);
    const endNatural = config.naturalExtent(selectionEnd);

    return {
      extentStart: startNatural.start,
      extentEnd: endNatural.end
    };
  }

  /**
   * Convert a date to a slider position (0-based index)
   */
  dateToSliderValue(date: Date, extentStart: Date, level: GranularityLevel): number {
    const config = this.getConfig(level);
    const diffMs = date.getTime() - extentStart.getTime();
    return Math.round(diffMs / config.stepMs);
  }

  /**
   * Convert a slider position back to a date
   */
  sliderValueToDate(value: number, extentStart: Date, level: GranularityLevel): Date {
    const config = this.getConfig(level);
    return new Date(extentStart.getTime() + value * config.stepMs);
  }

  /**
   * Calculate the number of steps in a given extent
   */
  calculateSteps(extentStart: Date, extentEnd: Date, level: GranularityLevel): number {
    const config = this.getConfig(level);
    const diffMs = extentEnd.getTime() - extentStart.getTime();
    return Math.round(diffMs / config.stepMs);
  }

  /**
   * Check if selection can be zoomed in (spans at least 2 units at next level)
   */
  canZoomInSelection(
    selectionStart: Date,
    selectionEnd: Date,
    currentLevel: GranularityLevel
  ): boolean {
    if (!this.canZoomIn(currentLevel)) return false;

    const nextLevel = this.zoomIn(currentLevel);
    const steps = this.calculateSteps(selectionStart, selectionEnd, nextLevel);
    return steps >= 2;
  }

  /**
   * Generate tick labels for the slider track
   */
  generateTickLabels(
    extentStart: Date,
    extentEnd: Date,
    level: GranularityLevel,
    maxTicks: number = 10
  ): { position: number; label: string }[] {
    const config = this.getConfig(level);
    const totalSteps = this.calculateSteps(extentStart, extentEnd, level);

    if (totalSteps === 0) return [];

    // Calculate step interval to get roughly maxTicks labels
    const interval = Math.max(1, Math.ceil(totalSteps / maxTicks));
    const ticks: { position: number; label: string }[] = [];

    for (let i = 0; i <= totalSteps; i += interval) {
      const date = this.sliderValueToDate(i, extentStart, level);
      ticks.push({
        position: (i / totalSteps) * 100,
        label: config.labelFormat(date)
      });
    }

    return ticks;
  }
}
