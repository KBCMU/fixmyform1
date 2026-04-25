---
version: alpha
name: FixMyForm Museum Gallery
description: A high-end photography gallery aesthetic for biomechanics analysis.
colors:
  bg-primary: "#000000"
  bg-secondary: "#050505"
  bg-card: "#0A0A0A"
  bg-elevated: "#0F0F0F"
  text-primary: "#FFFFFF"
  text-secondary: "#AAAAAA"
  text-muted: "#666666"
  accent-orange: "#E66A23"
  accent-amber: "#D1834B"
  accent-warm: "#E2B28B"
  accent-orange-dark: "#A4430F"
  danger: "#EF4444"
  warning: "#F59E0B"
  success: "#22C55E"
typography:
  headline-display:
    fontFamily: Inter
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-serif:
    fontFamily: Cormorant
    fontWeight: 400
    lineHeight: 1.2
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label-mono:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 500
    letterSpacing: 0.05em
spacing:
  base: 16px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.accent-orange}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 12px
---

# FixMyForm Design System

## Overview

Also known as "Brand & Style".

FixMyForm uses a "Museum Gallery Palette" – characterized by pure black backgrounds and high-contrast warmth. The UI should evoke a premium, cinematic, and highly refined aesthetic, akin to a high-end photography gallery. It relies on subtle slow fade-ins, ambient glows, and minimal noise textures to create an elevated and deeply immersive environment.

## Colors

The palette is rooted in pure blacks and stark whites, complemented by warm amber and orange accents.

- **Backgrounds:** Pure black (`#000000`) for the primary canvas, with subtle steps up to `#0F0F0F` for elevated surfaces. This maximizes contrast and focus.
- **Text:** Crisp white (`#FFFFFF`) for primary content, softened to grays (`#AAAAAA`, `#666666`) for secondary and muted context.
- **Accents:** Warm, sophisticated oranges and ambers (e.g., `#E66A23`, `#D1834B`) serve as the primary interaction and highlight colors, providing a glowing contrast against the dark background.
- **Borders:** Extremely subtle, semi-transparent white borders (8% to 25% opacity) to maintain the delicate structural hierarchy without overwhelming the dark theme.

## Typography

The typography strategy leverages modern, clean sans-serifs combined with elegant serifs for display, and monospace for technical data.

- **Primary Sans:** **Inter** serves as the utilitarian workhorse, providing ultimate readability for the interface and body text.
- **Display Serif:** **Cormorant** brings an editorial, high-end gallery feel to large headlines or featured statements.
- **Technical Mono:** **Geist Mono** is used for precise numbers, telemetry data, and biomechanical measurements, reflecting the precision of the AI analysis.

## Layout

The layout uses generous spacing to let the content breathe, mimicking the white (or black, in this case) space of a physical art gallery.

A structured but airy scale is employed, ensuring that focal points like the uploaded form analysis videos take center stage, while controls and metadata recede elegantly into the periphery.

## Elevation & Depth

Depth is not achieved through drop shadows, which get lost on pure black. Instead, elevation is communicated through:
1. **Tonal Layers:** Using `#000000` for the base, `#050505` for secondary sections, and `#0A0A0A` for cards.
2. **Ambient Glows:** Soft, heavily blurred glows (e.g., the `animate-ambient-glow` utility) behind primary focal points.
3. **Subtle Borders:** 8% white borders define edges for elevated cards without creating harsh lines.

## Shapes

Shapes are mostly geometric and precise.

Interactive elements and cards utilize minimal border radii (`4px` to `8px`) to maintain an engineered, modern, and sharp aesthetic.

## Components

- **Buttons:** Primary buttons glow with the warm accent colors (`#E66A23`), featuring subtle scaling on hover.
- **Cards:** Used sparingly, with dark backgrounds (`#0A0A0A`), subtle transparent white borders, and an optional noise texture overlay to break up flat digital surfaces.
- **Scrollbars:** Custom, thin (4px) scrollbars with subtle thumb tracks to maintain the minimal aesthetic.

## Do's and Don'ts

- **Do** rely heavily on negative space to draw the eye to the lifting analysis footage.
- **Don't** use large, bright blocks of color; reserve the amber/orange palette strictly for interactive accents or critical highlights.
- **Do** apply the `.bg-noise` utility on dark, empty sections to add organic texture.
- **Don't** use standard box-shadows; they are ineffective on `#000000`. Use borders or background lightness to differentiate depth.
