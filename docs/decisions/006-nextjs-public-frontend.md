# 006 — Replace Streamlit as the public production UI

## Context

A Streamlit prototype (`app/streamlit_app.py`) validated the product flow quickly,
but it exposes framework chrome, offers limited control over responsive layout,
navigation, theming, and accessibility, and reads as a demo rather than a product.

## Decision

Build the public frontend with Next.js (App Router), TypeScript, Tailwind CSS,
shadcn/ui, and Recharts in `apps/web`, mobile-first, with three product sections:
Overview, Campaign Simulator, and Technical Validation. The Streamlit app is kept
as a historical prototype and is not part of the production runtime.

## Alternatives considered

- **Polish Streamlit further**: fastest, but the ceiling on mobile UX and product
  feel is low and the framework controls the page shell.
- **Plain React with Vite**: lighter, but loses server rendering of report-backed
  pages, metadata handling, and routing conventions.

## Why

Server-rendered report pages, a typed API client, component-level tests, and full
control over responsive behaviour and theming are needed for a recruiter-facing
product. Next.js provides them without extra infrastructure.

## Tradeoffs

A second language and toolchain in the repository, and more surface to test.
Deleting the prototype was deferred to avoid destroying useful reference work.

## Status

Accepted.
