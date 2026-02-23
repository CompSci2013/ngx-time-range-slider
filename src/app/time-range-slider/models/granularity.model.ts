export type GranularityLevel = 'decades' | 'years' | 'months' | 'days' | 'minutes' | 'deciseconds';

export interface GranularityConfig {
  level: GranularityLevel;
  stepMs: number;
  labelFormat: (date: Date) => string;
  naturalExtent: (date: Date) => { start: Date; end: Date };
}

export const GRANULARITY_ORDER: GranularityLevel[] = [
  'decades',
  'years',
  'months',
  'days',
  'minutes',
  'deciseconds'
];
