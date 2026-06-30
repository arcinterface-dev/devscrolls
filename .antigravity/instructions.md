# Project Instructions
  
  This is a personal technical platform built with Astro + Markdown + React Islands.
  Static-first. No backend for at least one year.

## Source of truth
  All design philosophy, UX rules, content strategy, accessibility standards,
  performance budgets, and architectural commitments live in `knowledge-base/`.

## Before any task
  1. Read `knowledge-base/INDEX.md`
  2. Read `knowledge-base/14_AI_Context.md` (rules — what you can/cannot change)
  3. Read the doc that owns the topic of the current task

## Invariants (never change without explicit user permission)
  - URLs are permanent
  - Static-first architecture
  - WCAG 2.2 AA accessibility floor
  - One brand voice ("thoughtful builder")
  - No tracking, popups, paywalls, interstitials
  - ≤5 primary nav items
  - One primary CTA per view
  See `14_AI_Context.md` for the full list.

## When in doubt
  Ask the user. Reversible decisions beat optimal ones.
  Log non-trivial decisions in `knowledge-base/_decisions/` per `15_Decision_Log_Template.md`.