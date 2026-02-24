export type GranularityLevel = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds';

export interface GranularityConfig {
  level: GranularityLevel;
  label: string;
  snapFn: (date: Date) => Date;
  formatThumb: (date: Date) => string;
  formatTick: (date: Date) => string;
}

export const GRANULARITY_ORDER: GranularityLevel[] = [
  'years',
  'months',
  'days',
  'hours',
  'minutes',
  'seconds'
];
