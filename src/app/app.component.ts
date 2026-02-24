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

  // Bounds for demo
  minDate = new Date('2000-01-01');
  maxDate = new Date('2030-12-31');

  onRangeChange(range: DateRange): void {
    this.currentRange = range;
    console.log('Range changed:', range);
  }

  onGranularityChange(level: GranularityLevel): void {
    this.currentGranularity = level;
    console.log('Granularity changed:', level);
  }

  setPresetRange(): void {
    this.rangeControl.setValue({
      start: new Date('2024-06-01'),
      end: new Date('2024-08-31')
    });
  }
}
