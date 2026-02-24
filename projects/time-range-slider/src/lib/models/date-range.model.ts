export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateRangeISO {
  start: string;
  end: string;
}

export type OutputFormat = 'date' | 'iso';
