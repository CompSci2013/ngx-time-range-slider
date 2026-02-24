import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DateRange, GranularityLevel } from './time-range-slider';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ngx-time-range-slider';

  // Demo with event binding
  currentRange: DateRange | null = null;
  currentGranularity: GranularityLevel = 'years';

  // Demo with reactive forms
  rangeControl = new FormControl<DateRange | null>(null);

  // Base case: data spans Sep 3 1995 — Feb 11 2026
  minDate = new Date('1995-09-03');
  maxDate = new Date('2026-02-11');

  onRangeChange(range: DateRange): void {
    this.currentRange = range;
  }

  onGranularityChange(level: GranularityLevel): void {
    this.currentGranularity = level;
  }

  setPresetRange(): void {
    this.rangeControl.setValue({
      start: new Date('2024-06-01'),
      end: new Date('2024-08-31')
    });
  }
}
