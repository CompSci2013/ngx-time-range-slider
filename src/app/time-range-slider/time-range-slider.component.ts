import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  forwardRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateRange, GranularityLevel, OutputFormat } from './models';
import { GranularityService } from './services/granularity.service';

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
  @Input() minDate: Date = new Date('1970-01-01');
  @Input() maxDate: Date = new Date('2099-12-31');
  @Input() outputFormat: OutputFormat = 'date';
  @Input() initialGranularity: GranularityLevel = 'years';
  @Input() disabled: boolean = false;

  @Output() rangeChange = new EventEmitter<DateRange>();
  @Output() granularityChange = new EventEmitter<GranularityLevel>();

  // Internal state
  currentLevel: GranularityLevel = 'years';
  extentStart!: Date;
  extentEnd!: Date;
  sliderValues: number[] = [0, 100];
  sliderMax: number = 100;

  // Tick labels
  tickLabels: { position: number; label: string }[] = [];

  // Display values
  selectionStartLabel: string = '';
  selectionEndLabel: string = '';

  // ControlValueAccessor
  private onChange: (value: DateRange | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private granularityService: GranularityService) {}

  ngOnInit(): void {
    this.currentLevel = this.initialGranularity;
    this.initializeExtent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['minDate'] || changes['maxDate']) {
      this.initializeExtent();
    }
  }

  private initializeExtent(): void {
    // Default extent based on current granularity
    const config = this.granularityService.getConfig(this.currentLevel);

    // Start with natural extent around current date or minDate
    const now = new Date();
    const referenceDate = now.getTime() >= this.minDate.getTime() && now.getTime() <= this.maxDate.getTime()
      ? now
      : this.minDate;

    const naturalExtent = config.naturalExtent(referenceDate);
    this.extentStart = new Date(Math.max(naturalExtent.start.getTime(), this.minDate.getTime()));
    this.extentEnd = new Date(Math.min(naturalExtent.end.getTime(), this.maxDate.getTime()));

    this.updateSliderRange();
    this.updateTickLabels();

    // Set initial selection to full extent
    this.sliderValues = [0, this.sliderMax];
    this.updateLabels();
  }

  private updateSliderRange(): void {
    this.sliderMax = this.granularityService.calculateSteps(
      this.extentStart,
      this.extentEnd,
      this.currentLevel
    );
  }

  private updateTickLabels(): void {
    this.tickLabels = this.granularityService.generateTickLabels(
      this.extentStart,
      this.extentEnd,
      this.currentLevel,
      8
    );
  }

  private updateLabels(): void {
    const config = this.granularityService.getConfig(this.currentLevel);
    const startDate = this.granularityService.sliderValueToDate(
      this.sliderValues[0],
      this.extentStart,
      this.currentLevel
    );
    const endDate = this.granularityService.sliderValueToDate(
      this.sliderValues[1],
      this.extentStart,
      this.currentLevel
    );
    this.selectionStartLabel = config.labelFormat(startDate);
    this.selectionEndLabel = config.labelFormat(endDate);
  }

  onSliderChange(values: number[]): void {
    this.sliderValues = values;
    this.updateLabels();
    this.emitRange();
    this.onTouched();
  }

  private emitRange(): void {
    const range = this.getCurrentRange();
    this.rangeChange.emit(range);
    this.onChange(range);
  }

  private getCurrentRange(): DateRange {
    const startDate = this.granularityService.sliderValueToDate(
      this.sliderValues[0],
      this.extentStart,
      this.currentLevel
    );
    const endDate = this.granularityService.sliderValueToDate(
      this.sliderValues[1],
      this.extentStart,
      this.currentLevel
    );
    return { start: startDate, end: endDate };
  }

  // Zoom controls
  get canZoomIn(): boolean {
    if (!this.granularityService.canZoomIn(this.currentLevel)) return false;
    const range = this.getCurrentRange();
    return this.granularityService.canZoomInSelection(range.start, range.end, this.currentLevel);
  }

  get canZoomOut(): boolean {
    return this.granularityService.canZoomOut(this.currentLevel);
  }

  zoomIn(): void {
    if (!this.canZoomIn || this.disabled) return;

    const range = this.getCurrentRange();
    const newLevel = this.granularityService.zoomIn(this.currentLevel);
    const { extentStart, extentEnd } = this.granularityService.calculateZoomInExtent(
      range.start,
      range.end,
      newLevel
    );

    this.currentLevel = newLevel;
    this.extentStart = extentStart;
    this.extentEnd = extentEnd;

    this.updateSliderRange();
    this.updateTickLabels();

    // Thumbs go to edges after zoom in
    this.sliderValues = [0, this.sliderMax];
    this.updateLabels();

    this.granularityChange.emit(this.currentLevel);
    this.emitRange();
  }

  zoomOut(): void {
    if (!this.canZoomOut || this.disabled) return;

    const range = this.getCurrentRange();
    const newLevel = this.granularityService.zoomOut(this.currentLevel);
    const { extentStart, extentEnd } = this.granularityService.calculateZoomOutExtent(
      range.start,
      range.end,
      newLevel,
      this.minDate,
      this.maxDate
    );

    this.currentLevel = newLevel;
    this.extentStart = extentStart;
    this.extentEnd = extentEnd;

    this.updateSliderRange();
    this.updateTickLabels();

    // Recalculate slider positions to preserve selection
    const newStartValue = this.granularityService.dateToSliderValue(
      range.start,
      this.extentStart,
      this.currentLevel
    );
    const newEndValue = this.granularityService.dateToSliderValue(
      range.end,
      this.extentStart,
      this.currentLevel
    );

    // Snap outward to preserve full selection
    this.sliderValues = [
      Math.max(0, Math.floor(newStartValue)),
      Math.min(this.sliderMax, Math.ceil(newEndValue))
    ];

    this.updateLabels();
    this.granularityChange.emit(this.currentLevel);
    this.emitRange();
  }

  // ControlValueAccessor implementation
  writeValue(value: DateRange | null): void {
    if (value && value.start && value.end) {
      // Calculate which level best represents this range
      // For now, keep current level and adjust extent to contain the value

      // Ensure extent contains the value
      if (value.start.getTime() < this.extentStart.getTime() ||
          value.end.getTime() > this.extentEnd.getTime()) {
        // Expand extent to contain value
        const config = this.granularityService.getConfig(this.currentLevel);
        const startNatural = config.naturalExtent(value.start);
        const endNatural = config.naturalExtent(value.end);
        this.extentStart = new Date(Math.max(startNatural.start.getTime(), this.minDate.getTime()));
        this.extentEnd = new Date(Math.min(endNatural.end.getTime(), this.maxDate.getTime()));
        this.updateSliderRange();
        this.updateTickLabels();
      }

      // Convert dates to slider values
      this.sliderValues = [
        this.granularityService.dateToSliderValue(value.start, this.extentStart, this.currentLevel),
        this.granularityService.dateToSliderValue(value.end, this.extentStart, this.currentLevel)
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
