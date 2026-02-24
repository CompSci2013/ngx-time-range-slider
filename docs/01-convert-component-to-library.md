# How to Convert an Angular Component into a Library

This guide walks through converting a component that lives inside an Angular application into a standalone, publishable Angular library.

## Prerequisites

- Angular CLI project (this guide uses Angular 14)
- A component already encapsulated in its own NgModule

## Step 1: Generate the Library Project

From your project root:

```bash
ng generate library time-range-slider --prefix=ntr
```

This creates:
- `projects/time-range-slider/` — the library source
- `projects/time-range-slider/src/public-api.ts` — the public API surface
- `projects/time-range-slider/ng-package.json` — ng-packagr configuration
- `projects/time-range-slider/package.json` — the library's own package.json

It also updates:
- `angular.json` — adds a new project entry with `projectType: "library"`
- `tsconfig.json` — adds a path mapping so the app can import from the library by name

**Note:** The library name must differ from the app project name. If your app is `ngx-time-range-slider`, name the library `time-range-slider`.

## Step 2: Move Component Code into the Library

Delete the auto-generated scaffolding in `projects/time-range-slider/src/lib/` and replace it with your real component files.

**Before (app structure):**
```
src/app/time-range-slider/
  ├── time-range-slider.component.ts
  ├── time-range-slider.component.html
  ├── time-range-slider.component.scss
  ├── time-range-slider.module.ts
  ├── models/
  ├── services/
  └── utils/
```

**After (library structure):**
```
projects/time-range-slider/src/lib/
  ├── time-range-slider.component.ts
  ├── time-range-slider.component.html
  ├── time-range-slider.component.scss
  ├── time-range-slider.module.ts
  ├── models/
  ├── services/
  └── utils/
```

Copy the files:
```bash
# Remove scaffolding
rm -f projects/time-range-slider/src/lib/*.ts

# Copy real code
cp -r src/app/time-range-slider/models projects/time-range-slider/src/lib/
cp -r src/app/time-range-slider/services projects/time-range-slider/src/lib/
cp -r src/app/time-range-slider/utils projects/time-range-slider/src/lib/
cp src/app/time-range-slider/time-range-slider.component.* projects/time-range-slider/src/lib/
cp src/app/time-range-slider/time-range-slider.module.ts projects/time-range-slider/src/lib/
```

## Step 3: Update the Component Selector

Change the selector prefix from `app-` to your library prefix:

```typescript
// Before
@Component({
  selector: 'app-time-range-slider',
  ...
})

// After
@Component({
  selector: 'ntr-time-range-slider',
  ...
})
```

## Step 4: Configure the Public API

Edit `projects/time-range-slider/src/public-api.ts` to export everything consumers need:

```typescript
export * from './lib/time-range-slider.component';
export * from './lib/time-range-slider.module';
export * from './lib/models';
export * from './lib/services/granularity.service';
```

Only export what external consumers should access. Internal utilities can remain unexported.

## Step 5: Update the Library package.json

Edit `projects/time-range-slider/package.json`:

```json
{
  "name": "@halolabs/ngx-time-range-slider",
  "version": "1.0.0",
  "description": "Angular 14 adaptive time range slider",
  "license": "MIT",
  "peerDependencies": {
    "@angular/common": "^14.2.0",
    "@angular/core": "^14.2.0",
    "@angular/forms": "^14.2.0",
    "primeng": "^14.2.0",
    "primeicons": "^6.0.0"
  },
  "dependencies": {
    "tslib": "^2.3.0"
  }
}
```

**Key decisions:**
- Use a scoped name (`@halolabs/...`) to avoid npm conflicts and group your org's packages
- Angular and PrimeNG are `peerDependencies` — the consuming app provides them
- Only `tslib` is a direct dependency (required by Angular compilation)

## Step 6: Update the Demo App

The original app becomes a demo/playground. Update its imports to consume the library:

```typescript
// src/app/app.module.ts
import { TimeRangeSliderModule } from 'time-range-slider';  // library name, not relative path

// src/app/app.component.ts
import { DateRange } from 'time-range-slider';
```

Update the template selector:
```html
<!-- Before -->
<app-time-range-slider [minDate]="minDate" [maxDate]="maxDate">

<!-- After -->
<ntr-time-range-slider [minDate]="minDate" [maxDate]="maxDate">
```

Delete the old component directory:
```bash
rm -r src/app/time-range-slider/
```

## Step 7: Build and Verify

```bash
# Build the library first (required before the app can import it)
ng build time-range-slider

# Then serve the demo app
ng serve
```

**Important:** The library must be built before the app can use it. The tsconfig path mapping points to `dist/time-range-slider`, which only exists after building.

## Step 8: Verify the Package

```bash
cd dist/time-range-slider
npm pack --dry-run
```

This shows exactly what will be published. You should see FESM bundles, type declarations, and the package.json.

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `Cannot find module 'time-range-slider'` | Library not built | Run `ng build time-range-slider` first |
| `Project name already exists` | Library name = app name | Use a different library name |
| `providedIn: 'root'` warning | Service scope | This is fine for libraries — Angular tree-shakes unused services |
