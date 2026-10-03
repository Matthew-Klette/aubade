# Aubade

**Light that keeps time with the sun.** A concept product site for a circadian lamp that reproduces the colour and intensity of the daylight outside your window, minute by minute.

Portfolio piece #1 by Matt Klette. The product is fictional; the frontend is real.

## What's worth looking at

- **The lamp is code.** No 3D model and no images: the travertine, marble and oak textures are drawn on canvas from a seeded PRNG, and the globe is a three.js `MeshPhysicalMaterial` (transmission + clearcoat) with an emissive core and a light inside (`src/lib/lampScene.ts`).
- **A day, in light.** A pinned, scroll-scrubbed scene from 04:30 to 23:30. The sky, sun arc, clock, readouts and the lamp's light are painted straight to the DOM and WebGL on every frame, without React re-rendering (`src/components/DayJourney.tsx`).
- **Perceptual colour.** Sky and light keyframes are interpolated in OKLab, so dawn never goes muddy (`src/lib/color.ts`, `src/lib/daylight.ts`).
- **Real physics in the chart.** The spectrum card plots Planck's law across 380–780 nm and morphs between colour temperatures (`src/lib/spectrum.ts`).
- **Live now.** The hero lamp and header show the colour of daylight for the visitor's local time, with the city taken from their time zone. There is no geolocation prompt.
- **Configurator + reservation.** Live 3D preview of metal, stone and size, a rolling price, and a native `<dialog>` form with validation and focus management.
- **Accessible motion.** With `prefers-reduced-motion`, there's no smooth scroll, pinning or curtain. The day scene swaps to a range slider.

## Design

High-end agency direction: warm ink and paper, a single brass signal colour (it only ever means "act"), Bodoni Moda display type over Jost, film grain, hairline rules, expo-out easing.

## Stack

Next.js 16 (static export) · React 19 · Tailwind CSS 4 · three.js · GSAP + ScrollTrigger · Lenis · Vitest

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests for colour, daylight, spectrum, pricing, validation
npm run build    # static site in ./out
```
