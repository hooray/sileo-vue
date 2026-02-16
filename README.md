# Sileo Vue

An opinionated, physics-based toast notification library for Vue 3. Features spring animations, gooey SVG morphing, swipe-to-dismiss, and auto expand/collapse.

Vue 3 port of [sileo](https://github.com/hiaaryan/sileo).

## Install

```bash
npm install sileo-vue
```

## Quick Start

```vue
<script setup>
import { sileo, SileoToaster } from 'sileo-vue'
import 'sileo-vue/dist/style.css'
</script>

<template>
  <SileoToaster />
</template>
```

Trigger toasts from anywhere:

```ts
sileo.success({ title: 'Saved!' })
sileo.error({ title: 'Oops', description: 'Something went wrong.' })
```

## API

| Method | Description |
|---|---|
| `sileo.show(opts)` | Default toast |
| `sileo.success(opts)` | Success toast |
| `sileo.error(opts)` | Error toast |
| `sileo.warning(opts)` | Warning toast |
| `sileo.info(opts)` | Info toast |
| `sileo.action(opts)` | Action toast with button |
| `sileo.promise(promise, opts)` | Async toast: loading → success / error |
| `sileo.dismiss(id)` | Dismiss a specific toast |
| `sileo.clear(position?)` | Clear all toasts (optionally by position) |

## SileoOptions

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | — | Toast title |
| `description` | `VNode \| string` | — | Body content |
| `position` | `SileoPosition` | `top-right` | One of 6 positions |
| `duration` | `number \| null` | `6000` | Auto-dismiss in ms. `null` = persistent |
| `icon` | `VNode \| null` | — | Custom icon |
| `fill` | `string` | — | SVG background color |
| `roundness` | `number` | `18` | Pill border radius |
| `autopilot` | `boolean \| { expand?, collapse? }` | `true` | Auto expand/collapse timing |
| `button` | `{ title, onClick }` | — | Action button |
| `styles` | `SileoStyles` | — | Custom class names for title, description, badge, button |

## Toaster Props

| Prop | Type | Default |
|---|---|---|
| `position` | `SileoPosition` | `top-right` |
| `offset` | `number \| string \| object` | — |
| `options` | `Partial<SileoOptions>` | — |

## Positions

```
top-left      top-center      top-right
bottom-left   bottom-center   bottom-right
```

## Promise Toast

```ts
sileo.promise(
  fetch('/api/data').then(r => r.json()),
  {
    loading: { title: 'Loading...' },
    success: (data) => ({
      title: 'Done',
      description: `Loaded ${data.length} items`,
    }),
    error: (err) => ({
      title: 'Failed',
      description: err.message,
    }),
  }
)
```

## Dark Mode

Toast appearance is driven by CSS custom properties. Use the browser's `color-scheme` and `light-dark()` for automatic theme switching:

```css
:root {
  color-scheme: light dark;
  --sileo-fill: light-dark(#1a1a1a, #FFFFFF);
  --sileo-text: light-dark(#e0e0e0, #1a1a1a);
}
```

Existing toasts update reactively when the theme changes — no re-render needed.

## CSS Variables

| Variable | Default | Description |
|---|---|---|
| `--sileo-fill` | `#FFFFFF` | Toast background (SVG fill) |
| `--sileo-text` | `#1a1a1a` | Toast text color |
| `--sileo-duration` | `600ms` | Animation duration |
| `--sileo-height` | `40px` | Pill height |
| `--sileo-width` | `350px` | Toast width |

## Development

```bash
# Install dependencies
pnpm install

# Run playground
pnpm dev

# Build library
pnpm build
```

## License

MIT
