import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { TimeRangeSliderComponent } from './time-range-slider.component';

@NgModule({
  declarations: [TimeRangeSliderComponent],
  imports: [
    CommonModule,
    FormsModule,
    SliderModule
  ],
  exports: [TimeRangeSliderComponent]
})
export class TimeRangeSliderModule {}
