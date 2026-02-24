import {
  Component,
  Input,
  OnInit,
  forwardRef,
  OnChanges,
  SimpleChanges,
  HostListener,
  ElementRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateRange, GranularityLevel } from './models';
import { GranularityService } from './services/granularity.service';
import { clampDate } from './utils/date-utils';

const SLIDER_RESOLUTION = 10000;

@Component({
  selector: 'app-time-range-slider',
  templateUrl: './time-range-slider.component.html',
  styleUrls: ['./time-range-slider.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeRangeSliderComponent),
      multi: true
    }
  ]
})
export class TimeRangeSliderComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() minDate!: Date;
  @Input() maxDate!: Date;
  @Input() disabled: boolean = false;

  // Internal state
  currentLevel: GranularityLevel = 'years';
  sliderValues: number[] = [0, SLIDER_RESOLUTION];
  sliderMax: number = SLIDER_RESOLUTION;

  // View extent (what the slider currently represents)
  viewStart!: Date;
  viewEnd!: Date;

  // Extent history for zoom-out
  private extentStack: { start: Date; end: Date }[] = [];

  // Tick labels
  tickLabels: { position: number; label: string }[] = [];

  // Tracked selection dates (precise — not derived from slider positions)
  private selectionStart!: Date;
  private selectionEnd!: Date;

  // Display values
  selectionStartLabel: string = '';
  selectionEndLabel: string = '';
  granularityLabel: string = 'Years';

  // Zoom key state
  zoomKeyHeld: boolean = false;
  isZoomed: boolean = false;

  // Thumb positions (percentage)
  get startThumbPosition(): number {
    return (this.sliderValues[0] / SLIDER_RESOLUTION) * 100;
  }

  get endThumbPosition(): number {
    return (this.sliderValues[1] / SLIDER_RESOLUTION) * 100;
  }

  // Can zoom in: selection is narrower than the full view
  get canZoomIn(): boolean {
    return this.sliderValues[0] > 0 || this.sliderValues[1] < SLIDER_RESOLUTION;
  }

  // ControlValueAccessor
  private onChange: (value: DateRange | null) => void = () => {};
  private onTouched: () => void = () => {};

  private viewMs: number = 0;

  constructor(
    private granularityService: GranularityService,
    private elRef: ElementRef
  ) {}

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === 'z' || key === 'control') {
      this.zoomKeyHeld = true;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === 'z' || key === 'control') {
      this.zoomKeyHeld = false;
    }
  }

  ngOnInit(): void {
    this.initialize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['minDate'] || changes['maxDate']) {
      this.initialize();
    }
  }

  private initialize(): void {
    if (!this.minDate || !this.maxDate) return;

    this.viewStart = new Date(this.minDate.getTime());
    this.viewEnd = new Date(this.maxDate.getTime());
    this.viewMs = this.viewEnd.getTime() - this.viewStart.getTime();
    if (this.viewMs <= 0) return;

    this.extentStack = [];
    this.isZoomed = false;

    this.currentLevel = this.granularityService.initialGranularity(this.viewMs);
    this.granularityLabel = this.granularityService.getConfig(this.currentLevel).label;

    this.sliderValues = [0, SLIDER_RESOLUTION];
    this.selectionStart = new Date(this.viewStart.getTime());
    this.selectionEnd = new Date(this.viewEnd.getTime());
    this.updateLabels();
    this.updateTicks();
  }

  // --- Date/slider conversion (relative to view extent) ---

  private sliderToDate(value: number): Date {
    const ratio = value / SLIDER_RESOLUTION;
    const ms = this.viewStart.getTime() + ratio * this.viewMs;
    return new Date(ms);
  }

  private dateToSlider(date: Date): number {
    const ratio = (date.getTime() - this.viewStart.getTime()) / this.viewMs;
    return Math.round(Math.max(0, Math.min(SLIDER_RESOLUTION, ratio * SLIDER_RESOLUTION)));
  }

  // --- Zoom ---

  zoomIn(): void {
    if (this.disabled || !this.canZoomIn) return;

    // Use tracked dates — these are the exact dates shown in the thumb labels
    const selStart = new Date(this.selectionStart.getTime());
    const selEnd = new Date(this.selectionEnd.getTime());

    // Push current view onto stack
    this.extentStack.push({ start: new Date(this.viewStart.getTime()), end: new Date(this.viewEnd.getTime()) });

    // Set new view to current selection
    this.viewStart = selStart;
    this.viewEnd = selEnd;
    this.viewMs = this.viewEnd.getTime() - this.viewStart.getTime();
    this.isZoomed = true;

    // Reset thumbs to full extent
    this.sliderValues = [0, SLIDER_RESOLUTION];
    this.selectionStart = new Date(selStart.getTime());
    this.selectionEnd = new Date(selEnd.getTime());

    // Recalculate granularity for new view
    this.currentLevel = this.granularityService.initialGranularity(this.viewMs);
    this.granularityLabel = this.granularityService.getConfig(this.currentLevel).label;

    this.updateLabels();
    this.updateTicks();
    this.emitRange();
  }

  zoomOut(): void {
    if (this.disabled || this.extentStack.length === 0) return;

    // Use tracked dates — exact selection preserved
    const selStart = new Date(this.selectionStart.getTime());
    const selEnd = new Date(this.selectionEnd.getTime());

    // Pop previous view from stack
    const prev = this.extentStack.pop()!;
    this.viewStart = prev.start;
    this.viewEnd = prev.end;
    this.viewMs = this.viewEnd.getTime() - this.viewStart.getTime();
    this.isZoomed = this.extentStack.length > 0;

    // Map the selection back onto the restored view
    this.sliderValues = [
      this.dateToSlider(selStart),
      this.dateToSlider(selEnd)
    ];

    // Granularity based on view extent
    this.currentLevel = this.granularityService.initialGranularity(this.viewMs);
    this.granularityLabel = this.granularityService.getConfig(this.currentLevel).label;

    this.updateLabels();
    this.updateTicks();
    this.emitRange();
  }

  resetZoom(): void {
    if (this.disabled || !this.isZoomed) return;

    // Use tracked dates — exact selection preserved
    const selStart = new Date(this.selectionStart.getTime());
    const selEnd = new Date(this.selectionEnd.getTime());

    // Reset to full data range
    this.viewStart = new Date(this.minDate.getTime());
    this.viewEnd = new Date(this.maxDate.getTime());
    this.viewMs = this.viewEnd.getTime() - this.viewStart.getTime();
    this.extentStack = [];
    this.isZoomed = false;

    // Map selection back to full range
    this.sliderValues = [
      this.dateToSlider(selStart),
      this.dateToSlider(selEnd)
    ];

    // Granularity based on view extent
    this.currentLevel = this.granularityService.initialGranularity(this.viewMs);
    this.granularityLabel = this.granularityService.getConfig(this.currentLevel).label;

    this.updateLabels();
    this.updateTicks();
    this.emitRange();
  }

  // Intercept mousedown to handle zoom before slider can move
  onSliderMousedown(event: MouseEvent): void {
    if (this.disabled) return;

    if (event.ctrlKey || this.zoomKeyHeld) {
      event.preventDefault();
      event.stopPropagation();
      if (this.canZoomIn) {
        this.zoomIn();
      }
    }
  }

  // --- Event handling ---

  onSliderChange(values: number[]): void {
    let [start, end] = values;

    // Enforce minimum gap
    const minGap = 1;
    if (end - start < minGap) {
      if (this.sliderValues[0] !== start) {
        start = Math.min(start, end - minGap);
      } else {
        end = Math.max(end, start + minGap);
      }
    }

    start = Math.max(0, Math.min(start, SLIDER_RESOLUTION - minGap));
    end = Math.min(SLIDER_RESOLUTION, Math.max(end, minGap));

    this.sliderValues = [start, end];

    // Track precise dates from slider positions (fluid movement, no snapping)
    this.selectionStart = this.sliderToDate(start);
    this.selectionEnd = this.sliderToDate(end);

    // Determine adaptive granularity
    const selectionMs = this.selectionEnd.getTime() - this.selectionStart.getTime();
    const newLevel = this.granularityService.determineGranularity(selectionMs, this.currentLevel);
    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      this.granularityLabel = this.granularityService.getConfig(this.currentLevel).label;
    }

    this.updateLabels();
    this.emitRange();
    this.onTouched();
  }

  // --- Label and tick updates ---

  private updateLabels(): void {
    const config = this.granularityService.getConfig(this.currentLevel);
    this.selectionStartLabel = config.formatThumb(this.selectionStart);
    this.selectionEndLabel = config.formatThumb(this.selectionEnd);
  }

  private updateTicks(): void {
    // Ticks span the full view extent
    this.tickLabels = this.granularityService.generateTicks(
      this.viewStart,
      this.viewEnd,
      this.currentLevel,
      this.viewStart,
      this.viewEnd
    );
  }

  // --- Output ---

  private emitRange(): void {
    const range = this.getCurrentRange();
    this.onChange(range);
  }

  private getCurrentRange(): DateRange {
    return { start: new Date(this.selectionStart.getTime()), end: new Date(this.selectionEnd.getTime()) };
  }

  // --- ControlValueAccessor ---

  writeValue(value: DateRange | null): void {
    if (value && value.start && value.end && this.viewStart && this.viewEnd) {
      const clampedStart = clampDate(value.start, this.viewStart, this.viewEnd);
      const clampedEnd = clampDate(value.end, this.viewStart, this.viewEnd);

      this.selectionStart = clampedStart;
      this.selectionEnd = clampedEnd;

      this.sliderValues = [
        this.dateToSlider(this.selectionStart),
        this.dateToSlider(this.selectionEnd)
      ];

      this.updateLabels();
    }
  }

  registerOnChange(fn: (value: DateRange | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
