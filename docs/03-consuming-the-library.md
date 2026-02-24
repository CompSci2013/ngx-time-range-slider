# How to Install and Use @halolabs/ngx-time-range-slider

You are on Team B. The time range slider component has been published to the internal GitLab npm registry. Here's how to pull it into your own Angular 14 project.

## Step 1: Configure the GitLab Registry

Create or edit `.npmrc` in your project root:

```
@halolabs:registry=http://gitlab.minilab/api/v4/projects/93/packages/npm/
//gitlab.minilab/api/v4/projects/93/packages/npm/:_authToken=<your-gitlab-token>
```

This tells npm: "any package scoped under `@halolabs` comes from our GitLab registry, not npmjs.org."

**Alternative — group-level registry** (reads all packages in the `halo` group):
```
@halolabs:registry=http://gitlab.minilab/api/v4/groups/7/-/packages/npm/
//gitlab.minilab/api/v4/groups/7/-/packages/npm/:_authToken=<your-gitlab-token>
```

Add `.npmrc` to your `.gitignore` if it contains tokens.

## Step 2: Install the Package

```bash
npm install @halolabs/ngx-time-range-slider
```

This pulls the library and adds it to your `package.json` dependencies.

### Peer Dependencies

The library requires these (your Angular 14 project likely already has them):

| Package | Version |
|---------|---------|
| `@angular/common` | ^14.2.0 |
| `@angular/core` | ^14.2.0 |
| `@angular/forms` | ^14.2.0 |
| `primeng` | ^14.2.0 |
| `primeicons` | ^6.0.0 |

If you don't have PrimeNG:
```bash
npm install primeng@^14.2.0 primeicons@^6.0.0
```

## Step 3: Import the Module

In your feature module or `app.module.ts`:

```typescript
import { TimeRangeSliderModule } from '@halolabs/ngx-time-range-slider';

@NgModule({
  imports: [
    // ... other imports
    TimeRangeSliderModule
  ]
})
export class YourModule { }
```

## Step 4: Use the Component

### Basic Usage with Reactive Forms

```typescript
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DateRange } from '@halolabs/ngx-time-range-slider';

@Component({
  selector: 'app-my-page',
  template: `
    <ntr-time-range-slider
      [minDate]="minDate"
      [maxDate]="maxDate"
      [formControl]="rangeControl">
    </ntr-time-range-slider>

    <p>Selected: {{ rangeControl.value | json }}</p>
  `
})
export class MyPageComponent {
  rangeControl = new FormControl<DateRange | null>(null);
  minDate = new Date('2020-01-01');
  maxDate = new Date('2026-12-31');
}
```

### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `[minDate]` | `Date` | Start of the full data range |
| `[maxDate]` | `Date` | End of the full data range |
| `[disabled]` | `boolean` | Disable the slider |
| `[formControl]` | `FormControl<DateRange>` | Reactive form binding |

### Output Value

The control emits a `DateRange` object:

```typescript
interface DateRange {
  start: Date;
  end: Date;
}
```

### Features

- **Adaptive granularity**: Automatically switches between years/months/days/hours/minutes/seconds based on selection width
- **Zoom**: Hold Ctrl (or Z) and click to zoom into the selected range. Zoom out and reset buttons appear when zoomed.
- **Major/minor ticks**: Parent-level boundaries shown as major ticks (e.g., year marks at month granularity)
- **Reactive forms**: Full `ControlValueAccessor` implementation

### Required Styles

Ensure PrimeNG styles are loaded in your `angular.json`:

```json
{
  "styles": [
    "node_modules/primeicons/primeicons.css",
    "node_modules/primeng/resources/themes/lara-light-blue/theme.css",
    "node_modules/primeng/resources/primeng.min.css"
  ]
}
```

And import `BrowserAnimationsModule` in your root module (required by PrimeNG).

## Updating

When a new version is published:

```bash
npm update @halolabs/ngx-time-range-slider
```

Or install a specific version:

```bash
npm install @halolabs/ngx-time-range-slider@1.1.0
```
