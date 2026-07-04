# Lukluk — Frontend Asset Guide

Each pet type profile uses images from `public/assets/PetLogo/`. These images should be composed of high-fidelity breed/type illustrations or photos, designed for use in:

- **Landing pet grid** — Small circles (56x56), images should center on the pet's face/head
- **Result page rank badges** — Medium rounded squares (64x64, 56x56), same head focus but slightly more body
- **Dashboard profile avatars** — Circle (52x52), tight face crop
- **Pet detail page hero** — Large rounded square (80x80), show full face + some body
- **Match Card export** — Circle (40-48px), face-only crop

## Pet Type Image Naming

Place PNGs in `public/assets/PetLogo/{slug}/1.png`, `2.png`, etc., where slug matches the YAML `id` field.

## Color Mapping by Section

| Section | Icon | Color Token |
|---------|------|-------------|
| Responsible Fit Score | 🛡️ | `bg-success` (green) |
| MBTI Compatibility | 🧠 | `bg-indigo-500` (purple) |
| Decision Agent | 💬 | `bg-blue-500` (blue) |
| Match Card | 📸 | `bg-warning` (amber) |

## Score Bar Colors

| Range | Color | Class |
|-------|-------|-------|
| ≥80% | Green | `bg-success` |
| 60-79% | Amber | `bg-warning` |
| <60% | Gray | `bg-muted-foreground` |
| MBTI (all) | Indigo | `bg-indigo-500` |

## Concern Severity Colors

| Severity | Background | Text | Border |
|----------|-----------|------|--------|
| Minor | `bg-warning/10` | `text-warning-foreground` | `border-warning/20` |
| Moderate | `bg-destructive/10` | `text-destructive` | `border-destructive/20` |
| Major | `bg-destructive/20` | `text-destructive` | `border-destructive/40` |

## Navigation States

| State | Nav Left | Nav Right |
|-------|----------|-----------|
| Unauthenticated | Logo + Lukluk | Experiences + "Sign in with Google" |
| Authenticated | Logo + Lukluk | Dashboard + Experiences + "Sign out" |
| Quiz | Back + Logo | Skip |
| Workspace/Owned | ← Dashboard | Pet name + status badge |

## CTA Buttons

All CTAs use `rounded-full` (pill). Primary actions use `bg-primary`, secondary use `bg-white border`, sign-in uses Google brand colors with Google "G" icon.
