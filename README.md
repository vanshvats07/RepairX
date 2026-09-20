# RepairX

RepairX is the intelligent repair and recovery network for electronic devices.

The product helps customers, workshops and technicians understand what happened to a device, what is happening now, and what the next best recovery decision should be.

RepairX does not just remember a device's past. It uses that past to understand the present and inform the next recovery decision.

## Problem

Most repair journeys begin with fragmented information:

- customer reports symptoms in plain language
- previous repair history is incomplete or lost
- local workshop options are not obvious
- part sourcing is inconsistent
- repair outcomes are not stored as reusable device memory
- post-repair recovery decisions are rarely guided by actual evidence

## Solution

RepairX connects:

- customer-reported symptoms
- device history and repair DNA
- live external evidence from SerpAPI
- workshop discovery in Delhi NCR
- technician verification
- parts intelligence
- quote generation
- quality-check execution
- repair outcome and recovery analysis

## Core MVP workflow

1. Create account
2. Add a device
3. Report a complaint
4. Add previous repair history
5. Start an AI-powered preliminary investigation
6. Gather live evidence from search sources
7. Discover local Delhi NCR workshops
8. Submit a repair request
9. Technician verifies the diagnosis
10. Discover compatible parts
11. Generate a quote
12. Customer approves the quote
13. Track the repair lifecycle
14. Complete quality checks
15. Deliver the repaired device
16. Update Repair DNA
17. Review repeat issue patterns
18. Evaluate recovery options

## Delhi NCR pilot strategy

The first target market is Delhi NCR, with smartphone repair as the initial use case.

The MVP focuses on the most relevant smartphone categories and brands in the catalog, without hardcoded UI-only logic. The product is designed to continue working for more device classes as the catalog grows.

## Why SerpAPI matters

SerpAPI is not the product itself. It enriches the actual repair decision with live information.

RepairX uses SerpAPI for:

- Google Search references and repair context
- Google Maps workshop discovery
- Google Shopping part-market signals

The product transforms those sources into product decisions, evidence and technician context rather than exposing raw search output as truth.

## AI role

RepairX keeps AI as a preliminary assessment layer.

The AI provides:

- structured complaint analysis
- likely problem areas to investigate
- evidence synthesis from live and historical data
- search plan generation

The technician remains the source of physical verification. AI output is not treated as a final diagnosis.

## Repair DNA

Repair DNA is the long-term startup differentiator.

After each repair, RepairX records:

- component history
- repair event timeline
- part installed
- workshop involved
- outcome
- cost
- warranty or follow-up notes

This creates a reusable memory that improves later investigations and recovery choices.

## Recovery intelligence

RepairX evaluates recovery decisions using actual data such as:

- current repair estimate
- market references
- historical repair spend
- repeat issue history
- current condition signals

This supports decisions around:

- repair
- refurbish
- sell as-is
- part recovery
- recycle

The system shows the assumptions and confidence level instead of pretending each recommendation is absolute.

## Architecture

This project uses a modular monolith built on:

- Next.js App Router
- MongoDB + Mongoose
- JWT-based authentication with server-side session cookies
- server-side business services for investigation, workshop discovery and quotes
- dynamic device catalog separation from user-owned devices
- existing RepairX models for workshop, technician, repair requests, jobs and audit data

## Tech stack

- Next.js 16
- React 19
- MongoDB
- Mongoose
- JWT
- SerpAPI
- Node.js

## Local setup

```bash
npm install
cp .env.local.example .env.local
# configure your MongoDB URI and secrets
npm run dev
```

Then open:

- http://localhost:3000

## Environment variables

See [.env.example](.env.example) and [.env.local.example](.env.local.example).

Required values for a working local or deployment environment include:

- `MONGODB_URI`
- `JWT_SECRET`
- `SERPAPI_API_KEY` when live discovery is enabled
- `AI_API_KEY` if AI-backed analysis is enabled
- `NEXT_PUBLIC_APP_URL`
- `APP_ENV`

Do not expose server secrets through `NEXT_PUBLIC_` variables.

## Database setup

The project expects MongoDB to be available for:

- users
- device catalog
- user devices
- investigations
- workshop data
- repair requests
- quotes
- repair jobs
- notifications
- audit events

## API setup

The app exposes server APIs under the existing App Router structure.

Core routes include:

- `/api/auth/login`
- `/api/auth/signup`
- `/api/devices`
- `/api/investigations`
- `/api/search`
- `/api/workshops/discover`
- `/api/repair-requests`
- `/api/quotes`
- `/api/repair-jobs`
- `/api/health`

## Demo flow

The preferred demonstration path is the same as the MVP workflow:

1. Customer signs up
2. Adds Samsung Galaxy S23
3. Reports overheating and rapid battery drain
4. RepairX creates an investigation
5. Live evidence is gathered
6. Relevant Delhi NCR workshops are discovered
7. Diagnostic request is submitted
8. Technician verifies the issue
9. Parts are discovered and selected
10. Quote is generated
11. Customer approves the quote
12. Repair job is tracked to completion
13. Quality check is completed
14. Repair DNA is updated
15. Recovery analysis is shown

This flow is meant to be the real product workflow, not a separate demo-only path.

## Product principles

RepairX is optimized for:

- reliability
- deployability
- real data
- usable repair operations
- workshop and technician workflows
- privacy-conscious device history storage
- production-ready deployment patterns

The current focus is a Delhi NCR pilot, not a large multi-city marketplace or a sprawling SaaS feature set.

## Roadmap

### Near-term

- harden production deployment configuration
- validate user and workshop journeys with real data
- improve empty-state UX for first-time customers
- strengthen admin operations for workshop verification and repair monitoring

### Medium-term

- expand device catalog coverage
- improve catalog matching quality
- tighten workshop onboarding and technician verification flow
- improve quote and repair analytics

### Long-term

- scale beyond Delhi NCR
- add stronger retention and archival policy
- expand catalog coverage and repair intelligence accuracy
- turn high-quality repair outcome data into a durable device memory network

## Development commands

```bash
npm run dev
npm run build
npm run lint -- --max-warnings=0
npm test
```

## Final note

RepairX is not trying to be a generic marketplace or a feature-heavy platform. It is a focused repair intelligence product that makes real repair work more informed, more traceable and more recoverable.

The objective is simple: process the first real repair from start to finish without developer intervention and then improve the product with actual customer and workshop data.
